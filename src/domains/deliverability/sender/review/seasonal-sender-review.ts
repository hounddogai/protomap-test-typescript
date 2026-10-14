/**
 * The seasonal sender review records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal sender review is in its life cycle. */
export type SeasonalSenderReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal sender review. Its code is unique within a tenant. */
export class SeasonalSenderReview {
  code: string;
  title: string;
  segment: string;
  revision: number;
  retries: number;
  status: SeasonalSenderReviewStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    revision: number,
    retries: number,
    status: SeasonalSenderReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.revision = revision;
    this.retries = retries;
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

  canMoveTo(next: SeasonalSenderReviewStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
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

  moveTo(next: SeasonalSenderReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal sender review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round(this.retries * this.revision * 100) / 100;
  }

  copy(): SeasonalSenderReview {
    return new SeasonalSenderReview(this.code, this.title, this.segment, this.revision, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal sender review in status new. */
export function newSeasonalSenderReview(code: string, title: string): SeasonalSenderReview {
  return new SeasonalSenderReview(code, title, "", 0, 0, "new");
}
