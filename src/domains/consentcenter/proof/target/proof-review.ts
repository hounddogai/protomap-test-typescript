import * as text from "../../../../kit/text.js";

/** Where a proof review is in its life cycle. */
export type ProofReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One proof review, with what the planners need to act on it. */
export class ProofReview {
  code: string;
  title: string;
  checksum: string;
  source: string;
  windowDays: number;
  ownerId: string;
  frequencyCap: number;
  status: ProofReviewStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    source: string,
    windowDays: number,
    ownerId: string,
    frequencyCap: number,
    status: ProofReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.source = source;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: ProofReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
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
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ProofReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round((this.windowDays - this.frequencyCap) * 100) / 100;
  }

  copy(): ProofReview {
    return new ProofReview(
      this.code,
      this.title,
      this.checksum,
      this.source,
      this.windowDays,
      this.ownerId,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a proof review in status planned. */
export function newProofReview(code: string, title: string): ProofReview {
  return new ProofReview(code, title, "", "", 0, "", 0, "planned");
}
