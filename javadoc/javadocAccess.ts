import {JavaClass, JavaConstructor, JavaField, JavaMethod, MetaIndex} from "./meta";
import fetch, {FetchError} from 'node-fetch'

export type SearchResult = SearchResultSuccess | SearchResultFail;

export type SearchResultSuccess = {
    success: true
    results: SearchResultEntry[]
}

export type SearchResultFail = {
    success: false
    failure: 'no_results' | 'too_many_results'
}

export type SearchResultEntry = SearchResultEntryClass | SearchResultEntryConstructor | SearchResultEntryField | SearchResultEntryMethod

export type SearchResultEntryClass = {
    type: 'class'
    data : JavaClass
}

export type SearchResultEntryConstructor = {
    type: 'constructor'
    cls : JavaClass
    data : JavaConstructor
}

export type SearchResultEntryField = {
    type: 'field'
    cls: JavaClass
    data : JavaField
}

export type SearchResultEntryMethod = {
    type: 'method'
    cls: JavaClass
    data : JavaMethod
}

export class JavadocAccess {
    
    private readonly baseUrl: string
    private indexCache: MetaIndex | undefined
    private classCache: Record<string, JavaClass>
    private classLookupFail: string[]
    private timeout: NodeJS.Timeout
    
    constructor(baseUrl: string) {
        this.baseUrl = (baseUrl.endsWith('/') ? baseUrl : baseUrl + '/') + 'meta/'
        this.indexCache = undefined
        this.classCache = {}
        this.classLookupFail = []
        this.timeout = setInterval(() => {
            this.indexCache = undefined
            this.classCache = {}
            this.classLookupFail = []
        }, 1000 * 60 * 5)
    }
    
    async search(term: string): Promise<SearchResult> {
        function emptyToUndefined(arg: string): string | undefined {
            return arg == '' ? undefined : arg
        }
        
        const parts: [string | undefined, string | undefined][] = []
        if (term.startsWith('#')) {
            // Simple: no class part
            parts.push([
                undefined,
                emptyToUndefined(term.substring(1))
            ])
        } else if (term.includes('#')) {
            // Simple: class is the part before the #, member behind
            parts.push([
                emptyToUndefined(term.substring(0, term.indexOf('#')).replace('$', '.')),
                emptyToUndefined(term.substring(term.indexOf('#') + 1))
            ])
        } else if (term.includes('.')) {
            // Last part can be part of class or member
            parts.push([
                emptyToUndefined(term.substring(0, term.lastIndexOf('.')).replace('$', '.')),
                emptyToUndefined(term.substring(term.lastIndexOf('.') + 1))
            ], [
                emptyToUndefined(term.replace('$', '.')),
                undefined
            ])
        } else {
            // Either class or member
            parts.push([
                emptyToUndefined(term.replace('$', '.')),
                undefined
            ], [
                undefined,
                emptyToUndefined(term)
            ])
        }
        return await this.searchParts(parts)
    }
    
    async searchParts(parts: [string | undefined, string | undefined][]): Promise<SearchResult> {
        const results: SearchResultEntry[] = []
        // Contains already scanned things
        // Can be:
        //   * class path (binary name + .json)
        //   * class path##abstract member search term
        //   * class name#member identifier
        const names: string[] = []
        const index = await this.index()
        if (index == undefined) {
            return {
                success: false,
                failure: 'no_results'
            }
        }
        function addMembers(cls: JavaClass, member: string, exact: boolean): boolean {
            if (results?.length > 5) return false
            let success = false
            if (member == 'new' && cls.constructors != undefined && cls.constructors.length > 0) {
                success = true
                for (const ctor of cls.constructors) {
                    if (!names.includes(cls.name + '#new|' + ctor.typeId)) {
                        names.push(cls.name + '#' + 'new|' + ctor.typeId)
                        results?.push({
                            type: 'constructor',
                            cls: cls,
                            data: ctor
                        })
                    }
                }
            }
            if (cls.fields != undefined) {
                for (const field of cls.fields) {
                    if (exact ? field.name == member : field.name.includes(member)) {
                        if (!names.includes(cls.name + '#' + field.name)) {
                            success = true
                            names.push(cls.name + '#' + field.name)
                            results?.push({
                                type: 'field',
                                cls: cls,
                                data: field
                            })
                        }
                    }
                }
            }
            if (cls.methods != undefined) {
                for (const method of cls.methods) {
                    if (exact ? method.name == member : method.name.includes(member)) {
                        if (!names.includes(cls.name + '#' + method.name + '|' + method.typeId)) {
                            success = true
                            names.push(cls.name + '#' + method.name + '|' + method.typeId)
                            results?.push({
                                type: 'method',
                                cls: cls,
                                data: method
                            })
                        }
                    }
                }
            }
            return success
        }
        async function add(name: string, member: string | undefined, cls: () => Promise<JavaClass | undefined>): Promise<void> {
            if (results.length > 5) return
            if (!names.includes(member == undefined ? name : name + '##' + member)) {
                names.push(member == undefined ? name : name + '##' + member)
                const classResult = await cls()
                if (classResult != undefined) {
                    if (member == undefined) {
                        results.push({
                            type: 'class',
                            data: classResult
                        })
                    } else {
                        if (!addMembers(classResult, member, true)) {
                            addMembers(classResult, member, false)
                        }
                    }
                }
            }
        }
        for (const part of parts) {
            const [ clsPart, memberPart ] = part
            if (memberPart != undefined && memberPart != 'new') {
                for (const name of Object.keys(index.members).filter(member => member.includes(memberPart))) {
                    const allClasses = index.members[name]
                    if (allClasses != undefined) {
                        for (const clsName of allClasses) {
                            if (clsPart == undefined || clsName.replace('$', '.').includes(clsPart)) {
                                await add(clsName, memberPart, () => this.class(clsName))
                            }
                        }
                    }
                }
            } else if (clsPart != undefined || memberPart == 'new') {
                // First check, if we have classes that match the name exactly
                // If there are, don't check the others
                let hasExact = false
                for (const sourceName of Object.keys(index.classes).filter(c => c == clsPart || c.endsWith('.' + clsPart))) {
                    const clsName = index.classes[sourceName]
                    if (clsName != undefined) {
                        await add(clsName, memberPart, () => this.class(clsName))
                        hasExact = true
                    }
                }
                if (!hasExact) {
                    for (const sourceName of Object.keys(index.classes).filter(c => clsPart == undefined || c.includes(clsPart))) {
                        const clsName = index.classes[sourceName]
                        if (clsName != undefined) {
                            await add(clsName, memberPart, () => this.class(clsName))
                        }
                    }
                }
            }
            if (results.length > 5) {
                return {
                    success: false,
                    failure: 'too_many_results'
                }
            }
        }
        if (results.length == 0) {
            return {
                success: false,
                failure: 'no_results'
            }
        } else {
            return {
                success: true,
                results: results
            }
        }
    }
    
    private async index(): Promise<MetaIndex | undefined> {
        try {
            const cached = this.indexCache
            if (cached != undefined) return cached
            const response = await fetch(this.baseUrl + 'index.json')
            const data: MetaIndex = await response.json() as MetaIndex
            this.indexCache = data
            return data;
        } catch (err) {
            console.error(err)
            return undefined
        }
    }
    
    private async class(cls: string): Promise<JavaClass | undefined> {
        try {
            const cached = this.classCache[cls]
            if (cached != undefined) return cached
            if (this.classLookupFail.includes(cls)) return undefined
            const response = await fetch(this.baseUrl + cls)
            const data: JavaClass = await response.json() as JavaClass
            this.classCache[cls] = data
            return data;
        } catch (err) {
            console.error(err)
            if (err instanceof FetchError) {
                this.classLookupFail.push(cls)
            }
            return undefined
        }
    }
}
