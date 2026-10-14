import * as text from "../../../../kit/text.js";

/** Where a manual path review is in its life cycle. */
export type ManualPathReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** One manual path review, with what the planners need to act on it. */
export class ManualPathReview {
  code: string;
  title: string;
  cost: number;
  checksum: string;
  clicks: number;
  floorValue: number;
  status: ManualPathReviewStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    checksum: string,
    clicks: number,
    floorValue: number,
    status: ManualPathReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.checksum = checksum;
    this.clicks = clicks;
    this.floorValue = floorValue;
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

  canMoveTo(next: ManualPathReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPathReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual path review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round((this.cost + this.clicks) * 100) / 100;
  }

  copy(): ManualPathReview {
    return new ManualPathReview(
      this.code,
      this.title,
      this.cost,
      this.checksum,
      this.clicks,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual path review in status new. */
export function newManualPathReview(code: string, title: string): ManualPathReview {
  return new ManualPathReview(code, title, 0, "", 0, 0, "new");
}
