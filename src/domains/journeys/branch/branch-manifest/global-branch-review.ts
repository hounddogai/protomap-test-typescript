import * as text from "../../../../kit/text.js";

/** Where a global branch review is in its life cycle. */
export type GlobalBranchReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One global branch review, with what the planners need to act on it. */
export class GlobalBranchReview {
  code: string;
  label: string;
  cost: number;
  locale: string;
  frequencyCap: number;
  archived: boolean;
  attributes: Map<string, string>;
  variant: string;
  checksum: string;
  cohort: string;
  audienceId: string;
  status: GlobalBranchReviewStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    locale: string,
    frequencyCap: number,
    archived: boolean,
    attributes: Map<string, string>,
    variant: string,
    checksum: string,
    cohort: string,
    audienceId: string,
    status: GlobalBranchReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.archived = archived;
    this.attributes = attributes;
    this.variant = variant;
    this.checksum = checksum;
    this.cohort = cohort;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalBranchReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalBranchReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global branch review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global branch review"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.cost + this.frequencyCap) * 100) / 100;
  }

  copy(): GlobalBranchReview {
    return new GlobalBranchReview(
      this.code,
      this.label,
      this.cost,
      this.locale,
      this.frequencyCap,
      this.archived,
      this.attributes,
      this.variant,
      this.checksum,
      this.cohort,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global branch review in status planned. */
export function newGlobalBranchReview(code: string, label: string): GlobalBranchReview {
  return new GlobalBranchReview(code, label, 0, "", 0, false, new Map<string, string>(), "", "", "", "", "planned");
}
