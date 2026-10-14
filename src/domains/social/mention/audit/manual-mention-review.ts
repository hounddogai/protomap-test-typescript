import * as text from "../../../../kit/text.js";

/** Where a manual mention review is in its life cycle. */
export type ManualMentionReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** One manual mention review, with what the planners need to act on it. */
export class ManualMentionReview {
  code: string;
  label: string;
  rate: number;
  batchSize: number;
  amount: number;
  minimum: number;
  pinned: boolean;
  tags: string[];
  status: ManualMentionReviewStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    batchSize: number,
    amount: number,
    minimum: number,
    pinned: boolean,
    tags: string[],
    status: ManualMentionReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.batchSize = batchSize;
    this.amount = amount;
    this.minimum = minimum;
    this.pinned = pinned;
    this.tags = tags;
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

  canMoveTo(next: ManualMentionReviewStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualMentionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual mention review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual mention review"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.minimum - this.amount) * 100) / 100;
  }

  copy(): ManualMentionReview {
    return new ManualMentionReview(
      this.code,
      this.label,
      this.rate,
      this.batchSize,
      this.amount,
      this.minimum,
      this.pinned,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual mention review in status new. */
export function newManualMentionReview(code: string, label: string): ManualMentionReview {
  return new ManualMentionReview(code, label, 0, 0, 0, 0, false, [], "new");
}
