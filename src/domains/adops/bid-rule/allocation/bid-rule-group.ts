import * as text from "../../../../kit/text.js";

/** Where a bid rule group is in its life cycle. */
export type BidRuleGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** One bid rule group, with what the planners need to act on it. */
export class BidRuleGroup {
  code: string;
  title: string;
  utmSource: string;
  cohort: string;
  name: string;
  score: number;
  attributes: Map<string, string>;
  externalRef: string;
  unit: string;
  impressions: number;
  status: BidRuleGroupStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    cohort: string,
    name: string,
    score: number,
    attributes: Map<string, string>,
    externalRef: string,
    unit: string,
    impressions: number,
    status: BidRuleGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.cohort = cohort;
    this.name = name;
    this.score = score;
    this.attributes = attributes;
    this.externalRef = externalRef;
    this.unit = unit;
    this.impressions = impressions;
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

  canMoveTo(next: BidRuleGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BidRuleGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.impressions + this.score) * 100) / 100;
  }

  copy(): BidRuleGroup {
    return new BidRuleGroup(
      this.code,
      this.title,
      this.utmSource,
      this.cohort,
      this.name,
      this.score,
      this.attributes,
      this.externalRef,
      this.unit,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a bid rule group in status requested. */
export function newBidRuleGroup(code: string, title: string): BidRuleGroup {
  return new BidRuleGroup(code, title, "", "", "", 0, new Map<string, string>(), "", "", 0, "requested");
}
