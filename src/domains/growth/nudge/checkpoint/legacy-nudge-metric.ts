import * as text from "../../../../kit/text.js";

/** Where a legacy nudge metric is in its life cycle. */
export type LegacyNudgeMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a legacy nudge metric and its current status. */
export class LegacyNudgeMetric {
  code: string;
  title: string;
  createdAt: number;
  sendAt: number;
  reviewer: string;
  approved: boolean;
  cohort: string;
  status: LegacyNudgeMetricStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    sendAt: number,
    reviewer: string,
    approved: boolean,
    cohort: string,
    status: LegacyNudgeMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.approved = approved;
    this.cohort = cohort;
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

  canMoveTo(next: LegacyNudgeMetricStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyNudgeMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy nudge metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy nudge metric"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.createdAt - this.sendAt) * 100) / 100;
  }

  copy(): LegacyNudgeMetric {
    return new LegacyNudgeMetric(
      this.code,
      this.title,
      this.createdAt,
      this.sendAt,
      this.reviewer,
      this.approved,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy nudge metric in status open. */
export function newLegacyNudgeMetric(code: string, title: string): LegacyNudgeMetric {
  return new LegacyNudgeMetric(code, title, 0, 0, "", false, "", "open");
}
