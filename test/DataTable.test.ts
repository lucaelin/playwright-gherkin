import { DataTable } from '../src/DataTable.js';
import { expect } from 'chai';

describe('DataTable', () => {
  let table: DataTable;

  beforeEach(() => {
    table = new DataTable([
      ['name', 'age', 'city'],
      ['John', '28', 'New York'],
      ['Jane', '32', 'London'],
      ['Jim', '40', 'Paris']
    ]);
  });

  it('returns the transposed row major data', () => {
    const expected = [
      ['name', 'John', 'Jane', 'Jim'],
      ['age', '28', '32', '40'],
      ['city', 'New York', 'London', 'Paris']
    ];
    expect(table.colMajor).to.deep.equal(expected);
  });

  it('returns an array of objects representing the columns', () => {
    const expected = [
      { name: 'age', John: '28',  Jane: '32', Jim: '40' },
      { name: 'city', John: 'New York',  Jane: 'London', Jim: 'Paris' },
    ];
    expect(table.colObjects).to.deep.equal(expected);
  });

  it('returns an array of objects representing the rows', () => {
    const expected = [
      { name: 'John', age: '28', city: 'New York' },
      { name: 'Jane', age: '32', city: 'London' },
      { name: 'Jim', age: '40', city: 'Paris' }
    ];
    expect(table.rowObjects).to.deep.equal(expected);
  });
});