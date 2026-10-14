import * as text from "../../../../kit/text.js";

/** Where a adaptive double opt in group is in its life cycle. */
export type AdaptiveDoubleOptInGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive double opt in group as the double opt in team keeps it. */
export class AdaptiveDoubleOptInGroup {
  code: string;
  title: string;
  weight: number;
  floorValue: number;
  description: string;
  updatedAt: number;
  campaignRef: string;
  threshold: number;
  score: number;
  country: string;
  ceiling: number;
  status: AdaptiveDoubleOptInGroupStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    floorValue: number,
    description: string,
    updatedAt: number,
    campaignRef: string,
    threshold: number,
    score: number,
    country: string,
    ceiling: number,
    status: AdaptiveDoubleOptInGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.floorValue = floorValue;
    this.description = description;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.threshold = threshold;
    this.score = score;
    this.country = country;
    this.ceiling = ceiling;
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

  canMoveTo(next: AdaptiveDoubleOptInGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveDoubleOptInGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive double opt in group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive double opt in group"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.ceiling + this.threshold) * 100) / 100;
  }

  copy(): AdaptiveDoubleOptInGroup {
    return new AdaptiveDoubleOptInGroup(
      this.code,
      this.title,
      this.weight,
      this.floorValue,
      this.description,
      this.updatedAt,
      this.campaignRef,
      this.threshold,
      this.score,
      this.country,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive double opt in group in status proposed. */
export function newAdaptiveDoubleOptInGroup(code: string, title: string): AdaptiveDoubleOptInGroup {
  return new AdaptiveDoubleOptInGroup(code, title, 0, 0, "", 0, "", 0, 0, "", 0, "proposed");
}
