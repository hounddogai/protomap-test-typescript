import * as text from "../../../../kit/text.js";

/** Where a nudge estimate is in its life cycle. */
export type NudgeEstimateStatus = "created" | "validated" | "published" | "retired";

/** One nudge estimate, with what the planners need to act on it. */
export class NudgeEstimate {
  code: string;
  label: string;
  source: string;
  segment: string;
  title: string;
  journeyId: string;
  score: number;
  status: NudgeEstimateStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    segment: string,
    title: string,
    journeyId: string,
    score: number,
    status: NudgeEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.segment = segment;
    this.title = title;
    this.journeyId = journeyId;
    this.score = score;
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

  canMoveTo(next: NudgeEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"nudge estimate"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): NudgeEstimate {
    return new NudgeEstimate(
      this.code,
      this.label,
      this.source,
      this.segment,
      this.title,
      this.journeyId,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a nudge estimate in status created. */
export function newNudgeEstimate(code: string, label: string): NudgeEstimate {
  return new NudgeEstimate(code, label, "", "", "", "", 0, "created");
}
