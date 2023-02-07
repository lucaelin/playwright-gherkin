function transpose(matrix: string[][]): string[][] {
  return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

function objectify(matrix: string[][]): Record<string, string | undefined>[] {
  const keys = matrix[0];
  const values = matrix.slice(1);
  return values.map((values)=>Object.fromEntries(keys.map((key, index)=>[key, values[index]])));
}

export class DataTable {
  private _colMajor?: string[][];
  public get colMajor() {
    if (this._colMajor) return this.colMajor;
    const colMajor = transpose(this.rowMajor)
    this._colMajor = colMajor;
    return colMajor;
  }

  private _colObjects?: Record<string, string | undefined>[];
  public get colObjects(): Record<string, string | undefined>[] {
    if (this._colObjects) return this.colObjects;
    const colObjects = objectify(this.colMajor)
    this._colObjects = colObjects;
    return colObjects;
  }

  private _rowObjects?: Record<string, string | undefined>[];
  public get rowObjects(): Record<string, string | undefined>[] {
    if (this._rowObjects) return this.rowObjects;
    const rowObjects = objectify(this.rowMajor)
    this._rowObjects = rowObjects;
    return rowObjects;
  }

  constructor(public readonly rowMajor: string[][]) {}
}