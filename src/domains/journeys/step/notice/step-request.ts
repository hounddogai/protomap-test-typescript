import * as text from "../../../../kit/text.js";

/** Where a step request is in its life cycle. */
export type StepRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a step request and its current status. */
export class StepRequest {
  code: string;
  label: string;
  startsAt: number;
  category: string;
  impressions: number;
  score: number;
  status: StepRequestStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    category: string,
    impressions: number,
    score: number,
    status: StepRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.category = category;
    this.impressions = impressions;
    this.score = score;
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

  canMoveTo(next: StepRequestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StepRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"step request"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.impressions - this.score) * 100) / 100;
  }

  copy(): StepRequest {
    return new StepRequest(
      this.code,
      this.label,
      this.startsAt,
      this.category,
      this.impressions,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a step request in status open. */
export function newStepRequest(code: string, label: string): StepRequest {
  return new StepRequest(code, label, 0, "", 0, 0, "open");
}
