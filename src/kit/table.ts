/**
 * Plain-text and CSV tables for reports.
 */

export class Table {
  title: string;
  headers: string[];
  rows: Array<string[]>;

  constructor(title: string, headers: string[], rows: Array<string[]>) {
    this.title = title;
    this.headers = headers;
    this.rows = rows;
  }

  addRow(cells: string[]): void {
    if (cells.length !== this.headers.length) {
      throw new Error(`row has ${cells.length} cells, table ${this.title} has ${this.headers.length} columns`);
    }
    this.rows.push(cells);
  }

  widths(): number[] {
    const widths: number[] = [];
    for (const header of this.headers) {
      widths.push(header.length);
    }
    for (const row of this.rows) {
      for (let i = 0; i < row.length; i++) {
        if (row[i]!.length > widths[i]!) {
          widths[i] = row[i]!.length;
        }
      }
    }
    return widths;
  }

  render(): string {
    const widths = this.widths();
    const lines = [this.title];
    const head: string[] = [];
    for (let i = 0; i < this.headers.length; i++) {
      head.push(this.headers[i]!.padEnd(widths[i]!, " "));
    }
    lines.push(head.join(" | "));
    for (const row of this.rows) {
      const padded: string[] = [];
      for (let i = 0; i < row.length; i++) {
        padded.push(row[i]!.padEnd(widths[i]!, " "));
      }
      lines.push(padded.join(" | "));
    }
    return lines.join("\n");
  }

  csv(): string {
    const lines = [this.headers.join(",")];
    for (const row of this.rows) {
      lines.push(row.join(","));
    }
    return lines.join("\n");
  }
}

export function newTable(title: string, headers: string[]): Table {
  return new Table(title, headers, []);
}
