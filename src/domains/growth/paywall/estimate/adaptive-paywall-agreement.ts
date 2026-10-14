import * as text from "../../../../kit/text.js";

/** Where a adaptive paywall agreement is in its life cycle. */
export type AdaptivePaywallAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive paywall agreement. Its code is unique within a tenant. */
export class AdaptivePaywallAgreement {
  code: string;
  title: string;
  impressions: number;
  notes: string;
  weight: number;
  status: AdaptivePaywallAgreementStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    notes: string,
    weight: number,
    status: AdaptivePaywallAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.notes = notes;
    this.weight = weight;
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

  canMoveTo(next: AdaptivePaywallAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptivePaywallAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive paywall agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round(this.weight * this.impressions * 100) / 100;
  }

  copy(): AdaptivePaywallAgreement {
    return new AdaptivePaywallAgreement(this.code, this.title, this.impressions, this.notes, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive paywall agreement in status open. */
export function newAdaptivePaywallAgreement(code: string, title: string): AdaptivePaywallAgreement {
  return new AdaptivePaywallAgreement(code, title, 0, "", 0, "open");
}
