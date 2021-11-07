export interface MetaIndex {
    classes: Record<string, string>
    members: Record<string, string[]>
}

export interface JavaClass {
    name: string
    simpleName: string
    sourceName: string
    modifiers: string[]
    nesting?: 'top_level' | 'member' | 'local' | 'anonymous'
    superClass?: JavaType
    interfaces?: JavaType[]
    enumValues?: string[]
    fields?: JavaField[]
    constructors?: JavaConstructor[]
    methods?: JavaMethod[]
    doc?: Javadoc
}

export interface JavaField {
    name: string
    modifiers: string[]
    type: JavaDesc
    constant?: string | number | boolean
    doc?: Javadoc
}

export type JavaConstructor = JavaExecutable

export type JavaMethod = JavaExecutable & {
    name: string
}

export interface JavaExecutable {
    modifiers: string[]
    typeId: string
    parameters: JavaParameter[]
    return: JavaDesc
    vararg?: boolean
    throws?: JavaDesc[]
    doc?: Javadoc
}

export interface JavaParameter {
    name: string
    type: JavaDesc
    doc?: string
}

export interface JavaType {
    name: string
    signature: string
    parameters?: JavaType[]
}

export interface JavaDesc {
    name: string
    desc?: string
    typeVar?: string
    binaryName?: string
    arrayOf?: string
}

export interface Javadoc {
    summary: string
    text: string
    properties?: JavadocBlock[]
}

export type JavadocBlock = JavadocBlockText | JavadocBlockClass

export interface JavadocBlockText {
    type: 'author' | 'deprecated' | 'return' | 'serial' | 'since' | 'unknown'
    text: string
}

export interface JavadocBlockClass {
    type: 'exception' | 'throws' | 'provides' | 'uses'
    cls: string
    text: string
}
