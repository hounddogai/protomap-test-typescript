import * as text from "../../../../kit/text.js";

/** Where a level record is in its life cycle. */
export type LevelRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One level record, with what the planners need to act on it. */
export class LevelRecord {
  code: string;
  label: string;
  variant: string;
  title: string;
  active: boolean;
  phone: string;
  amount: number;
  status: LevelRecordStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    title: string,
    active: boolean,
    phone: string,
    amount: number,
    status: LevelRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.title = title;
    this.active = active;
    this.phone = phone;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): LevelRecord {
    return new LevelRecord(
      this.code,
      this.label,
      this.variant,
      this.title,
      this.active,
      this.phone,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level record in status proposed. */
export function newLevelRecord(code: string, label: string): LevelRecord {
  return new LevelRecord(code, label, "", "", false, "", 0, "proposed");
}
