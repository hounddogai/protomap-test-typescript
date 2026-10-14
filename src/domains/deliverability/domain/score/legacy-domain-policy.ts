import * as text from "../../../../kit/text.js";

/** Where a legacy domain policy is in its life cycle. */
export type LegacyDomainPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a legacy domain policy and its current status. */
export class LegacyDomainPolicy {
  code: string;
  label: string;
  budget: number;
  conversionRate: number;
  rate: number;
  currency: string;
  expiresAt: number;
  timezone: string;
  frequencyCap: number;
  status: LegacyDomainPolicyStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    conversionRate: number,
    rate: number,
    currency: string,
    expiresAt: number,
    timezone: string,
    frequencyCap: number,
    status: LegacyDomainPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.rate = rate;
    this.currency = currency;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: LegacyDomainPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyDomainPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy domain policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy domain policy"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.rate * this.budget * 100) / 100;
  }

  copy(): LegacyDomainPolicy {
    return new LegacyDomainPolicy(
      this.code,
      this.label,
      this.budget,
      this.conversionRate,
      this.rate,
      this.currency,
      this.expiresAt,
      this.timezone,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy domain policy in status draft. */
export function newLegacyDomainPolicy(code: string, label: string): LegacyDomainPolicy {
  return new LegacyDomainPolicy(code, label, 0, 0, 0, "", 0, "", 0, "draft");
}
