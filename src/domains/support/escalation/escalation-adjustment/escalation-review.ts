import * as text from "../../../../kit/text.js";

/** Where a escalation review is in its life cycle. */
export type EscalationReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A escalation review as the escalation team keeps it. */
export class EscalationReview {
  code: string;
  title: string;
  pinned: boolean;
  cost: number;
  country: string;
  graceDays: number;
  active: boolean;
  timezone: string;
  sequence: number;
  status: EscalationReviewStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    cost: number,
    country: string,
    graceDays: number,
    active: boolean,
    timezone: string,
    sequence: number,
    status: EscalationReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.cost = cost;
    this.country = country;
    this.graceDays = graceDays;
    this.active = active;
    this.timezone = timezone;
    this.sequence = sequence;
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

  canMoveTo(next: EscalationReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: EscalationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netValue(): number {
    return Math.round(this.sequence * this.graceDays * 100) / 100;
  }

  copy(): EscalationReview {
    return new EscalationReview(
      this.code,
      this.title,
      this.pinned,
      this.cost,
      this.country,
      this.graceDays,
      this.active,
      this.timezone,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a escalation review in status new. */
export function newEscalationReview(code: string, title: string): EscalationReview {
  return new EscalationReview(code, title, false, 0, "", 0, false, "", 0, "new");
}
