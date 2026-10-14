import * as text from "../../../../kit/text.js";

/** Where a strict redemption exception is in its life cycle. */
export type StrictRedemptionExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict redemption exception, with what the planners need to act on it. */
export class StrictRedemptionException {
  code: string;
  title: string;
  pinned: boolean;
  updatedAt: number;
  version: number;
  cohort: string;
  archived: boolean;
  priority: number;
  budget: number;
  score: number;
  status: StrictRedemptionExceptionStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    updatedAt: number,
    version: number,
    cohort: string,
    archived: boolean,
    priority: number,
    budget: number,
    score: number,
    status: StrictRedemptionExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.updatedAt = updatedAt;
    this.version = version;
    this.cohort = cohort;
    this.archived = archived;
    this.priority = priority;
    this.budget = budget;
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

  canMoveTo(next: StrictRedemptionExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
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
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictRedemptionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict redemption exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"strict redemption exception"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.updatedAt + this.budget) * 100) / 100;
  }

  copy(): StrictRedemptionException {
    return new StrictRedemptionException(
      this.code,
      this.title,
      this.pinned,
      this.updatedAt,
      this.version,
      this.cohort,
      this.archived,
      this.priority,
      this.budget,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict redemption exception in status new. */
export function newStrictRedemptionException(code: string, title: string): StrictRedemptionException {
  return new StrictRedemptionException(code, title, false, 0, 0, "", false, 0, 0, 0, "new");
}
