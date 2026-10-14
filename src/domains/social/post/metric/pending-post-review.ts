import * as text from "../../../../kit/text.js";

/** Where a pending post review is in its life cycle. */
export type PendingPostReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a pending post review and its current status. */
export class PendingPostReview {
  code: string;
  title: string;
  score: number;
  priority: number;
  summary: string;
  category: string;
  durationMinutes: number;
  ceiling: number;
  frequencyCap: number;
  limit: number;
  status: PendingPostReviewStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    priority: number,
    summary: string,
    category: string,
    durationMinutes: number,
    ceiling: number,
    frequencyCap: number,
    limit: number,
    status: PendingPostReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.priority = priority;
    this.summary = summary;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
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

  canMoveTo(next: PendingPostReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingPostReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending post review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round(this.durationMinutes * this.score * 100) / 100;
  }

  copy(): PendingPostReview {
    return new PendingPostReview(
      this.code,
      this.title,
      this.score,
      this.priority,
      this.summary,
      this.category,
      this.durationMinutes,
      this.ceiling,
      this.frequencyCap,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending post review in status planned. */
export function newPendingPostReview(code: string, title: string): PendingPostReview {
  return new PendingPostReview(code, title, 0, 0, "", "", 0, 0, 0, 0, "planned");
}
