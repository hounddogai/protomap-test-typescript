import * as text from "../../../../kit/text.js";

/** Where a pending bid rule score is in its life cycle. */
export type PendingBidRuleScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending bid rule score and its current status. */
export class PendingBidRuleScore {
  code: string;
  label: string;
  utmSource: string;
  windowDays: number;
  priority: number;
  endsAt: number;
  pinned: boolean;
  archived: boolean;
  status: PendingBidRuleScoreStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    windowDays: number,
    priority: number,
    endsAt: number,
    pinned: boolean,
    archived: boolean,
    status: PendingBidRuleScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.priority = priority;
    this.endsAt = endsAt;
    this.pinned = pinned;
    this.archived = archived;
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

  canMoveTo(next: PendingBidRuleScoreStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBidRuleScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bid rule score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.endsAt - this.priority) * 100) / 100;
  }

  copy(): PendingBidRuleScore {
    return new PendingBidRuleScore(
      this.code,
      this.label,
      this.utmSource,
      this.windowDays,
      this.priority,
      this.endsAt,
      this.pinned,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending bid rule score in status open. */
export function newPendingBidRuleScore(code: string, label: string): PendingBidRuleScore {
  return new PendingBidRuleScore(code, label, "", 0, 0, 0, false, false, "open");
}
