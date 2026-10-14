import * as text from "../../../../kit/text.js";

/** Where a regional approval slot is in its life cycle. */
export type RegionalApprovalSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a regional approval slot and its current status. */
export class RegionalApprovalSlot {
  code: string;
  label: string;
  conversionRate: number;
  margin: number;
  contactEmail: string;
  unit: string;
  status: RegionalApprovalSlotStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    margin: number,
    contactEmail: string,
    unit: string,
    status: RegionalApprovalSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.margin = margin;
    this.contactEmail = contactEmail;
    this.unit = unit;
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

  canMoveTo(next: RegionalApprovalSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: RegionalApprovalSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional approval slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin + this.conversionRate) * 100) / 100;
  }

  copy(): RegionalApprovalSlot {
    return new RegionalApprovalSlot(
      this.code,
      this.label,
      this.conversionRate,
      this.margin,
      this.contactEmail,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a regional approval slot in status proposed. */
export function newRegionalApprovalSlot(code: string, label: string): RegionalApprovalSlot {
  return new RegionalApprovalSlot(code, label, 0, 0, "", "", "proposed");
}
