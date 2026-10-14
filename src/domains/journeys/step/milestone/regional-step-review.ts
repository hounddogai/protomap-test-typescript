import * as text from "../../../../kit/text.js";

/** Where a regional step review is in its life cycle. */
export type RegionalStepReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One regional step review, with what the planners need to act on it. */
export class RegionalStepReview {
  code: string;
  name: string;
  ownerId: string;
  sequence: number;
  endsAt: number;
  pinned: boolean;
  frequencyCap: number;
  source: string;
  status: RegionalStepReviewStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    sequence: number,
    endsAt: number,
    pinned: boolean,
    frequencyCap: number,
    source: string,
    status: RegionalStepReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.pinned = pinned;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalStepReviewStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalStepReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional step review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round(this.endsAt * this.sequence * 100) / 100;
  }

  copy(): RegionalStepReview {
    return new RegionalStepReview(
      this.code,
      this.name,
      this.ownerId,
      this.sequence,
      this.endsAt,
      this.pinned,
      this.frequencyCap,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional step review in status open. */
export function newRegionalStepReview(code: string, name: string): RegionalStepReview {
  return new RegionalStepReview(code, name, "", 0, 0, false, 0, "", "open");
}
