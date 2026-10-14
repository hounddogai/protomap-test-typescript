import * as text from "../../../../kit/text.js";

/** Where a invite review is in its life cycle. */
export type InviteReviewStatus = "created" | "validated" | "published" | "retired";

/** One invite review, with what the planners need to act on it. */
export class InviteReview {
  code: string;
  title: string;
  maximum: number;
  createdAt: number;
  limit: number;
  status: InviteReviewStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    createdAt: number,
    limit: number,
    status: InviteReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteReviewStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round((this.createdAt - this.limit) * 100) / 100;
  }

  copy(): InviteReview {
    return new InviteReview(this.code, this.title, this.maximum, this.createdAt, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite review in status created. */
export function newInviteReview(code: string, title: string): InviteReview {
  return new InviteReview(code, title, 0, 0, 0, "created");
}
