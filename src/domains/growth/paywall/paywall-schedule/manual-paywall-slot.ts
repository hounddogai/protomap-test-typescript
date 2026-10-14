import * as text from "../../../../kit/text.js";

/** Where a manual paywall slot is in its life cycle. */
export type ManualPaywallSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual paywall slot. Its code is unique within a tenant. */
export class ManualPaywallSlot {
  code: string;
  title: string;
  cohort: string;
  bid: number;
  checksum: string;
  description: string;
  threshold: number;
  status: ManualPaywallSlotStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    bid: number,
    checksum: string,
    description: string,
    threshold: number,
    status: ManualPaywallSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.bid = bid;
    this.checksum = checksum;
    this.description = description;
    this.threshold = threshold;
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

  canMoveTo(next: ManualPaywallSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualPaywallSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual paywall slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual paywall slot"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.threshold + this.bid) * 100) / 100;
  }

  copy(): ManualPaywallSlot {
    return new ManualPaywallSlot(
      this.code,
      this.title,
      this.cohort,
      this.bid,
      this.checksum,
      this.description,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual paywall slot in status proposed. */
export function newManualPaywallSlot(code: string, title: string): ManualPaywallSlot {
  return new ManualPaywallSlot(code, title, "", 0, "", "", 0, "proposed");
}
