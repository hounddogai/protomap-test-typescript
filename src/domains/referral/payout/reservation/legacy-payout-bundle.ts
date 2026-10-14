import * as text from "../../../../kit/text.js";

/** Where a legacy payout bundle is in its life cycle. */
export type LegacyPayoutBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a legacy payout bundle and its current status. */
export class LegacyPayoutBundle {
  code: string;
  label: string;
  campaignRef: string;
  phone: string;
  graceDays: number;
  status: LegacyPayoutBundleStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    phone: string,
    graceDays: number,
    status: LegacyPayoutBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.phone = phone;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyPayoutBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPayoutBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy payout bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): LegacyPayoutBundle {
    return new LegacyPayoutBundle(this.code, this.label, this.campaignRef, this.phone, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy payout bundle in status planned. */
export function newLegacyPayoutBundle(code: string, label: string): LegacyPayoutBundle {
  return new LegacyPayoutBundle(code, label, "", "", 0, "planned");
}
