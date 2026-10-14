import * as text from "../../../../kit/text.js";

/** Where a global payout draft is in its life cycle. */
export type GlobalPayoutDraftStatus = "created" | "validated" | "published" | "retired";

/** A global payout draft as the payout team keeps it. */
export class GlobalPayoutDraft {
  code: string;
  title: string;
  archived: boolean;
  version: number;
  threshold: number;
  cost: number;
  score: number;
  conversionRate: number;
  status: GlobalPayoutDraftStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    version: number,
    threshold: number,
    cost: number,
    score: number,
    conversionRate: number,
    status: GlobalPayoutDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.version = version;
    this.threshold = threshold;
    this.cost = cost;
    this.score = score;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: GlobalPayoutDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalPayoutDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global payout draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.conversionRate * this.score * 100) / 100;
  }

  copy(): GlobalPayoutDraft {
    return new GlobalPayoutDraft(
      this.code,
      this.title,
      this.archived,
      this.version,
      this.threshold,
      this.cost,
      this.score,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global payout draft in status created. */
export function newGlobalPayoutDraft(code: string, title: string): GlobalPayoutDraft {
  return new GlobalPayoutDraft(code, title, false, 0, 0, 0, 0, 0, "created");
}
