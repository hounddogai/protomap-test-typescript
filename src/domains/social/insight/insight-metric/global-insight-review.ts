import * as text from "../../../../kit/text.js";

/** Where a global insight review is in its life cycle. */
export type GlobalInsightReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One global insight review, with what the planners need to act on it. */
export class GlobalInsightReview {
  code: string;
  label: string;
  capacity: number;
  score: number;
  region: string;
  startsAt: number;
  category: string;
  visible: boolean;
  attributes: Map<string, string>;
  cohort: string;
  summary: string;
  status: GlobalInsightReviewStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    score: number,
    region: string,
    startsAt: number,
    category: string,
    visible: boolean,
    attributes: Map<string, string>,
    cohort: string,
    summary: string,
    status: GlobalInsightReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.score = score;
    this.region = region;
    this.startsAt = startsAt;
    this.category = category;
    this.visible = visible;
    this.attributes = attributes;
    this.cohort = cohort;
    this.summary = summary;
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

  canMoveTo(next: GlobalInsightReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalInsightReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global insight review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round(this.capacity * this.score * 100) / 100;
  }

  copy(): GlobalInsightReview {
    return new GlobalInsightReview(
      this.code,
      this.label,
      this.capacity,
      this.score,
      this.region,
      this.startsAt,
      this.category,
      this.visible,
      this.attributes,
      this.cohort,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global insight review in status draft. */
export function newGlobalInsightReview(code: string, label: string): GlobalInsightReview {
  return new GlobalInsightReview(code, label, 0, 0, "", 0, "", false, new Map<string, string>(), "", "", "draft");
}
