import * as text from "../../../../kit/text.js";

/** Where a adaptive opt out record is in its life cycle. */
export type AdaptiveOptOutRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive opt out record as the opt out team keeps it. */
export class AdaptiveOptOutRecord {
  code: string;
  label: string;
  reviewer: string;
  budget: number;
  timezone: string;
  discount: number;
  priority: number;
  durationMinutes: number;
  capacity: number;
  status: AdaptiveOptOutRecordStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    budget: number,
    timezone: string,
    discount: number,
    priority: number,
    durationMinutes: number,
    capacity: number,
    status: AdaptiveOptOutRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.budget = budget;
    this.timezone = timezone;
    this.discount = discount;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.capacity = capacity;
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

  canMoveTo(next: AdaptiveOptOutRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveOptOutRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive opt out record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.budget - this.discount) * 100) / 100;
  }

  copy(): AdaptiveOptOutRecord {
    return new AdaptiveOptOutRecord(
      this.code,
      this.label,
      this.reviewer,
      this.budget,
      this.timezone,
      this.discount,
      this.priority,
      this.durationMinutes,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive opt out record in status proposed. */
export function newAdaptiveOptOutRecord(code: string, label: string): AdaptiveOptOutRecord {
  return new AdaptiveOptOutRecord(code, label, "", 0, "", 0, 0, 0, 0, "proposed");
}
