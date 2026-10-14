import * as text from "../../../../kit/text.js";

/** Where a regional pacing review is in its life cycle. */
export type RegionalPacingReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a regional pacing review and its current status. */
export class RegionalPacingReview {
  code: string;
  name: string;
  impressions: number;
  clicks: number;
  weight: number;
  region: string;
  budget: number;
  attributes: Map<string, string>;
  locale: string;
  externalRef: string;
  status: RegionalPacingReviewStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    clicks: number,
    weight: number,
    region: string,
    budget: number,
    attributes: Map<string, string>,
    locale: string,
    externalRef: string,
    status: RegionalPacingReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.clicks = clicks;
    this.weight = weight;
    this.region = region;
    this.budget = budget;
    this.attributes = attributes;
    this.locale = locale;
    this.externalRef = externalRef;
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

  canMoveTo(next: RegionalPacingReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalPacingReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional pacing review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional pacing review"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.impressions - this.clicks) * 100) / 100;
  }

  copy(): RegionalPacingReview {
    return new RegionalPacingReview(
      this.code,
      this.name,
      this.impressions,
      this.clicks,
      this.weight,
      this.region,
      this.budget,
      this.attributes,
      this.locale,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional pacing review in status draft. */
export function newRegionalPacingReview(code: string, name: string): RegionalPacingReview {
  return new RegionalPacingReview(code, name, 0, 0, 0, "", 0, new Map<string, string>(), "", "", "draft");
}
