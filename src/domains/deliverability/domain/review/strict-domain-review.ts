/**
 * The strict domain review records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict domain review is in its life cycle. */
export type StrictDomainReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict domain review, with what the planners need to act on it. */
export class StrictDomainReview {
  code: string;
  title: string;
  campaignRef: string;
  name: string;
  tags: string[];
  endsAt: number;
  label: string;
  score: number;
  status: StrictDomainReviewStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    name: string,
    tags: string[],
    endsAt: number,
    label: string,
    score: number,
    status: StrictDomainReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.name = name;
    this.tags = tags;
    this.endsAt = endsAt;
    this.label = label;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictDomainReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictDomainReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict domain review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict domain review"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.score * this.endsAt * 100) / 100;
  }

  copy(): StrictDomainReview {
    return new StrictDomainReview(
      this.code,
      this.title,
      this.campaignRef,
      this.name,
      this.tags,
      this.endsAt,
      this.label,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict domain review in status new. */
export function newStrictDomainReview(code: string, title: string): StrictDomainReview {
  return new StrictDomainReview(code, title, "", "", [], 0, "", 0, "new");
}
