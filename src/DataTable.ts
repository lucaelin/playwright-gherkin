type Zip<Keys extends string[], Values extends string[]> = Keys extends [infer Key, ...infer RestKeys]
  ? Values extends [infer Value, ...infer RestValues]
    ? [[Key, Value], ...Zip<RestKeys extends string[] ? RestKeys : never, RestValues extends string[] ? RestValues : never>]
    : []
  : [];

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
type FromEntries<T> = T extends [infer Key, any][]
  ? { [K in Extract<Key, string>]: Extract<ArrayElement<T>, [K, any]>[1]}
  : { [key in string]: any }

type FromTable<Rows extends string[][]> =
  Rows extends [infer Headers, ...infer ValueRows] 
    ? ValueRows extends [infer Values, ...infer RestRows] 
      ? [
        FromEntries<Zip<Headers extends string[] ? Headers : never, Values extends string[] ? Values : never>>, 
        ...FromTable<[Headers extends string[] ? Headers : never, ...(RestRows extends string[][] ? RestRows : never)]>
      ] 
      : []
    : Record<string, any>[];


type Transpose<T extends string[][]> =
  T[Extract<keyof T, number>] extends [...infer V]
    ? { 
      [K in keyof V]: (
        T extends any[] 
          ? { 
            [L in keyof T]: K extends keyof T[L] 
              ? T[L][K] 
              : never 
          }
          : never
      )
    } : never;


function transpose<T extends string[][]>(matrix: T): Transpose<T> {
  return matrix[0].map((col, i) => matrix.map(row => row[i])) as unknown as Transpose<T>;
}

function objectify<T extends string[][]>(matrix: T): FromTable<T> {
  const keys = matrix[0];
  const values = matrix.slice(1);
  return values.map((values)=>Object.fromEntries(keys.map((key, index)=>[key, values[index]]))) as FromTable<T>;
}

export class DataTable<Table extends string[][] = string[][]> {
  private _colMajor?: Transpose<Table>;
  public get colMajor(): Transpose<Table> {
    if (this._colMajor) return this.colMajor;
    const colMajor = transpose(this.rowMajor)
    this._colMajor = colMajor;
    return colMajor;
  }

  private _colObjects?: FromTable<Transpose<Table>>;
  public get colObjects(): FromTable<Transpose<Table>> {
    if (this._colObjects) return this.colObjects;
    const colObjects = objectify(this.colMajor)
    this._colObjects = colObjects;
    return colObjects;
  }

  private _rowObjects?: FromTable<Table>;
  public get rowObjects(): FromTable<Table> {
    if (this._rowObjects) return this.rowObjects;
    const rowObjects = objectify(this.rowMajor)
    this._rowObjects = rowObjects;
    return rowObjects;
  }

  constructor(public readonly rowMajor: Table) {}
}