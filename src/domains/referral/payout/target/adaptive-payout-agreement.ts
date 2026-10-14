import * as text from "../../../../kit/text.js";

/** Where a adaptive payout agreement is in its life cycle. */
export type AdaptivePayoutAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive payout agreement as the payout team keeps it. */
export class AdaptivePayoutAgreement {
  code: string;
  title: string;
  ownerId: string;
  impressions: number;
  version: number;
  notes: string;
  status: AdaptivePayoutAgreementStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    impressions: number,
    version: number,
    notes: string,
    status: AdaptivePayoutAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.impressions = impressions;
    this.version = version;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptivePayoutAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePayoutAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive payout agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"adaptive payout agreement"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.impressions - this.version) * 100) / 100;
  }

  copy(): AdaptivePayoutAgreement {
    return new AdaptivePayoutAgreement(
      this.code,
      this.title,
      this.ownerId,
      this.impressions,
      this.version,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive payout agreement in status draft. */
export function newAdaptivePayoutAgreement(code: string, title: string): AdaptivePayoutAgreement {
  return new AdaptivePayoutAgreement(code, title, "", 0, 0, "", "draft");
}
