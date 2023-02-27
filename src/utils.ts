export type Split<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

export type Join<S extends string[], D extends string> =
    S extends [string, ...infer Rest] ? `${S[0]}${Rest extends [string, ...string[]] ? `${D}${Join<Rest, D>}` : ``}` : ``;

export type Replace<Str extends string[], Orig, New> = Str extends [infer Test, ...infer Rest] ? 
  [Test extends Orig ? New : Test, ...(Rest extends string[] ? Replace<Rest, Orig, New> : Rest)] : Str;

export type StripFirst<A extends string[] | []> = A extends [string, ...infer Rest] ? Rest : [];

export type Tokenize<T extends string> = Split<T, ' '>;
export type Template<T extends string> = Replace<Tokenize<T>, '{}', string>;

export type ExtractTemplateValues<T extends string[], A extends T> = T extends [] ? [] : string extends T[0] ? [A[0], ...ExtractTemplateValues<StripFirst<T>, StripFirst<A>>] : ExtractTemplateValues<StripFirst<T>, StripFirst<A>>;
