import * as text from "../../../../kit/text.js";

/** Where a lenient credit record is in its life cycle. */
export type LenientCreditRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a lenient credit record and its current status. */
export class LenientCreditRecord {
  code: string;
  title: string;
  variant: string;
  priority: number;
  notes: string;
  status: LenientCreditRecordStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    priority: number,
    notes: string,
    status: LenientCreditRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.priority = priority;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientCreditRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientCreditRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient credit record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient credit record"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): LenientCreditRecord {
    return new LenientCreditRecord(this.code, this.title, this.variant, this.priority, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient credit record in status open. */
export function newLenientCreditRecord(code: string, title: string): LenientCreditRecord {
  return new LenientCreditRecord(code, title, "", 0, "", "open");
}
