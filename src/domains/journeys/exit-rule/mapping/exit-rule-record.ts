import * as text from "../../../../kit/text.js";

/** Where a exit rule record is in its life cycle. */
export type ExitRuleRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** A exit rule record. Its code is unique within a tenant. */
export class ExitRuleRecord {
  code: string;
  label: string;
  quantity: number;
  conversionRate: number;
  graceDays: number;
  sequence: number;
  status: ExitRuleRecordStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    conversionRate: number,
    graceDays: number,
    sequence: number,
    status: ExitRuleRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.graceDays + this.conversionRate) * 100) / 100;
  }

  copy(): ExitRuleRecord {
    return new ExitRuleRecord(
      this.code,
      this.label,
      this.quantity,
      this.conversionRate,
      this.graceDays,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a exit rule record in status requested. */
export function newExitRuleRecord(code: string, label: string): ExitRuleRecord {
  return new ExitRuleRecord(code, label, 0, 0, 0, 0, "requested");
}
