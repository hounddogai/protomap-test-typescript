import * as text from "../../../../kit/text.js";

/** Where a lenient ticket view review is in its life cycle. */
export type LenientTicketViewReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient ticket view review. Its code is unique within a tenant. */
export class LenientTicketViewReview {
  code: string;
  name: string;
  region: string;
  score: number;
  source: string;
  checksum: string;
  unit: string;
  clicks: number;
  priority: number;
  attributes: Map<string, string>;
  approved: boolean;
  status: LenientTicketViewReviewStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    score: number,
    source: string,
    checksum: string,
    unit: string,
    clicks: number,
    priority: number,
    attributes: Map<string, string>,
    approved: boolean,
    status: LenientTicketViewReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.score = score;
    this.source = source;
    this.checksum = checksum;
    this.unit = unit;
    this.clicks = clicks;
    this.priority = priority;
    this.attributes = attributes;
    this.approved = approved;
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

  canMoveTo(next: LenientTicketViewReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientTicketViewReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient ticket view review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.priority - this.score) * 100) / 100;
  }

  copy(): LenientTicketViewReview {
    return new LenientTicketViewReview(
      this.code,
      this.name,
      this.region,
      this.score,
      this.source,
      this.checksum,
      this.unit,
      this.clicks,
      this.priority,
      this.attributes,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient ticket view review in status proposed. */
export function newLenientTicketViewReview(code: string, name: string): LenientTicketViewReview {
  return new LenientTicketViewReview(code, name, "", 0, "", "", "", 0, 0, new Map<string, string>(), false, "proposed");
}
