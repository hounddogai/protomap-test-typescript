import * as text from "../../../../kit/text.js";

/** Where a opt out record is in its life cycle. */
export type OptOutRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a opt out record and its current status. */
export class OptOutRecord {
  code: string;
  name: string;
  clicks: number;
  quantity: number;
  active: boolean;
  locale: string;
  status: OptOutRecordStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    quantity: number,
    active: boolean,
    locale: string,
    status: OptOutRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.quantity = quantity;
    this.active = active;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.clicks + this.quantity) * 100) / 100;
  }

  copy(): OptOutRecord {
    return new OptOutRecord(this.code, this.name, this.clicks, this.quantity, this.active, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a opt out record in status created. */
export function newOptOutRecord(code: string, name: string): OptOutRecord {
  return new OptOutRecord(code, name, 0, 0, false, "", "created");
}
