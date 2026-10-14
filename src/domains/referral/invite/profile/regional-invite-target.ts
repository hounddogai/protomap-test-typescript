import * as text from "../../../../kit/text.js";

/** Where a regional invite target is in its life cycle. */
export type RegionalInviteTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a regional invite target and its current status. */
export class RegionalInviteTarget {
  code: string;
  label: string;
  budget: number;
  expiresAt: number;
  discount: number;
  score: number;
  cohort: string;
  reviewer: string;
  audienceId: string;
  status: RegionalInviteTargetStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    expiresAt: number,
    discount: number,
    score: number,
    cohort: string,
    reviewer: string,
    audienceId: string,
    status: RegionalInviteTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.score = score;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
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

  canMoveTo(next: RegionalInviteTargetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalInviteTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional invite target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.score - this.expiresAt) * 100) / 100;
  }

  copy(): RegionalInviteTarget {
    return new RegionalInviteTarget(
      this.code,
      this.label,
      this.budget,
      this.expiresAt,
      this.discount,
      this.score,
      this.cohort,
      this.reviewer,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional invite target in status new. */
export function newRegionalInviteTarget(code: string, label: string): RegionalInviteTarget {
  return new RegionalInviteTarget(code, label, 0, 0, 0, 0, "", "", "", "new");
}
