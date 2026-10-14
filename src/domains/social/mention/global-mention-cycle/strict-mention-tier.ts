import * as text from "../../../../kit/text.js";

/** Where a strict mention tier is in its life cycle. */
export type StrictMentionTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict mention tier as the mention team keeps it. */
export class StrictMentionTier {
  code: string;
  title: string;
  approved: boolean;
  openRate: number;
  region: string;
  attributes: Map<string, string>;
  ceiling: number;
  campaignRef: string;
  ratio: number;
  threshold: number;
  status: StrictMentionTierStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    openRate: number,
    region: string,
    attributes: Map<string, string>,
    ceiling: number,
    campaignRef: string,
    ratio: number,
    threshold: number,
    status: StrictMentionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.openRate = openRate;
    this.region = region;
    this.attributes = attributes;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.threshold = threshold;
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

  canMoveTo(next: StrictMentionTierStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictMentionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict mention tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round(this.openRate * this.ceiling * 100) / 100;
  }

  copy(): StrictMentionTier {
    return new StrictMentionTier(
      this.code,
      this.title,
      this.approved,
      this.openRate,
      this.region,
      this.attributes,
      this.ceiling,
      this.campaignRef,
      this.ratio,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict mention tier in status open. */
export function newStrictMentionTier(code: string, title: string): StrictMentionTier {
  return new StrictMentionTier(code, title, false, 0, "", new Map<string, string>(), 0, "", 0, 0, "open");
}
