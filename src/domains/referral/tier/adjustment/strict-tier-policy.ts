import * as text from "../../../../kit/text.js";

/** Where a strict tier policy is in its life cycle. */
export type StrictTierPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict tier policy as the tier team keeps it. */
export class StrictTierPolicy {
  code: string;
  label: string;
  description: string;
  floorValue: number;
  version: number;
  category: string;
  currency: string;
  conversionRate: number;
  journeyId: string;
  status: StrictTierPolicyStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    floorValue: number,
    version: number,
    category: string,
    currency: string,
    conversionRate: number,
    journeyId: string,
    status: StrictTierPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.floorValue = floorValue;
    this.version = version;
    this.category = category;
    this.currency = currency;
    this.conversionRate = conversionRate;
    this.journeyId = journeyId;
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

  canMoveTo(next: StrictTierPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictTierPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict tier policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.conversionRate - this.floorValue) * 100) / 100;
  }

  copy(): StrictTierPolicy {
    return new StrictTierPolicy(
      this.code,
      this.label,
      this.description,
      this.floorValue,
      this.version,
      this.category,
      this.currency,
      this.conversionRate,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict tier policy in status requested. */
export function newStrictTierPolicy(code: string, label: string): StrictTierPolicy {
  return new StrictTierPolicy(code, label, "", 0, 0, "", "", 0, "", "requested");
}
