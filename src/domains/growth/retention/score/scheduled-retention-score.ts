import * as text from "../../../../kit/text.js";

/** Where a scheduled retention score is in its life cycle. */
export type ScheduledRetentionScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One scheduled retention score, with what the planners need to act on it. */
export class ScheduledRetentionScore {
  code: string;
  label: string;
  title: string;
  externalRef: string;
  category: string;
  campaignRef: string;
  score: number;
  status: ScheduledRetentionScoreStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    externalRef: string,
    category: string,
    campaignRef: string,
    score: number,
    status: ScheduledRetentionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.externalRef = externalRef;
    this.category = category;
    this.campaignRef = campaignRef;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledRetentionScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledRetentionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled retention score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled retention score"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ScheduledRetentionScore {
    return new ScheduledRetentionScore(
      this.code,
      this.label,
      this.title,
      this.externalRef,
      this.category,
      this.campaignRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a scheduled retention score in status draft. */
export function newScheduledRetentionScore(code: string, label: string): ScheduledRetentionScore {
  return new ScheduledRetentionScore(code, label, "", "", "", "", 0, "draft");
}
