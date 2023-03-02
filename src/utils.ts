export type Split<S extends string, D extends string> =
    string extends S 
      ? string[] 
      : S extends '' 
        ? [] 
        : S extends `${infer T}${D}${infer U}` 
          ? [T, ...Split<U, D>] 
          : [S];

export type Join<S extends string[], D extends string> =
    S extends [string, ...infer Rest] 
      ? `${S[0]}${Rest extends [string, ...string[]] ? `${D}${Join<Rest, D>}` : ``}` 
      : ``;

export type Replace<Str extends string[], Orig, New> = Str extends [infer Test, ...infer Rest] 
  ? [Test extends Orig ? New : Test, ...(Rest extends string[] ? Replace<Rest, Orig, New> : Rest)] 
  : Str;

export type Unionify<Str extends string, D extends string> = Split<Str, D>[number];
export type UnionifyAll<Str extends string[], D extends string> = 
  Str extends [infer S, ...infer R]
  ? [S extends string ? Unionify<S, D> : never, ...(R extends string[] ? UnionifyAll<R, D> : [])]
  : [];

export type StripFirst<A extends string[] | []> = A extends [string, ...infer Rest] ? Rest : [];

export type Tokenize<T extends string> = 
  string extends T
  ? string[] 
  : T extends '' 
    ? [] 
    : T extends `${infer T} "${infer U}"${infer V}` 
      ? [...Split<T, ' '>, U, ...Tokenize<V>] 
      : Split<T, ' '>;

export type Template<T extends string> = Replace<UnionifyAll<Tokenize<T>, '/'>, '{}', string>;

type SanitizeTemplateValue<T extends string> = T extends `"${infer D}"` ? D : T;

export type ExtractTemplateValues<T extends string[], A extends string[]> = 
  T extends [] 
  ? [] 
  : string[] extends T 
    ? string[]
    : string[] extends A 
      ? string[]
      : string extends T[0] 
        ? [SanitizeTemplateValue<A[0]>, ...ExtractTemplateValues<StripFirst<T>, StripFirst<A>>] 
        : ExtractTemplateValues<StripFirst<T>, StripFirst<A>>;