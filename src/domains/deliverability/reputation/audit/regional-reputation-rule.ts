import * as text from "../../../../kit/text.js";

/** Where a regional reputation rule is in its life cycle. */
export type RegionalReputationRuleStatus = "created" | "validated" | "published" | "retired";

/** A regional reputation rule as the reputation team keeps it. */
export class RegionalReputationRule {
  code: string;
  label: string;
  currency: string;
  country: string;
  clicks: number;
  sequence: number;
  utmSource: string;
  campaignRef: string;
  title: string;
  status: RegionalReputationRuleStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    country: string,
    clicks: number,
    sequence: number,
    utmSource: string,
    campaignRef: string,
    title: string,
    status: RegionalReputationRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.country = country;
    this.clicks = clicks;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.campaignRef = campaignRef;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalReputationRuleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalReputationRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reputation rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.sequence - this.clicks) * 100) / 100;
  }

  copy(): RegionalReputationRule {
    return new RegionalReputationRule(
      this.code,
      this.label,
      this.currency,
      this.country,
      this.clicks,
      this.sequence,
      this.utmSource,
      this.campaignRef,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional reputation rule in status created. */
export function newRegionalReputationRule(code: string, label: string): RegionalReputationRule {
  return new RegionalReputationRule(code, label, "", "", 0, 0, "", "", "", "created");
}
