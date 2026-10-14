import * as text from "../../../../kit/text.js";

/** Where a global level adjustment is in its life cycle. */
export type GlobalLevelAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global level adjustment. Its code is unique within a tenant. */
export class GlobalLevelAdjustment {
  code: string;
  label: string;
  reviewer: string;
  amount: number;
  timezone: string;
  quantity: number;
  capacity: number;
  source: string;
  revision: number;
  durationMinutes: number;
  status: GlobalLevelAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    amount: number,
    timezone: string,
    quantity: number,
    capacity: number,
    source: string,
    revision: number,
    durationMinutes: number,
    status: GlobalLevelAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.amount = amount;
    this.timezone = timezone;
    this.quantity = quantity;
    this.capacity = capacity;
    this.source = source;
    this.revision = revision;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: GlobalLevelAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalLevelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global level adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"global level adjustment"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.amount + this.durationMinutes) * 100) / 100;
  }

  copy(): GlobalLevelAdjustment {
    return new GlobalLevelAdjustment(
      this.code,
      this.label,
      this.reviewer,
      this.amount,
      this.timezone,
      this.quantity,
      this.capacity,
      this.source,
      this.revision,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global level adjustment in status proposed. */
export function newGlobalLevelAdjustment(code: string, label: string): GlobalLevelAdjustment {
  return new GlobalLevelAdjustment(code, label, "", 0, "", 0, 0, "", 0, 0, "proposed");
}
