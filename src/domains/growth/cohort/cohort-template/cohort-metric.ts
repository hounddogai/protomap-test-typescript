import * as text from "../../../../kit/text.js";

/** Where a cohort metric is in its life cycle. */
export type CohortMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One cohort metric, with what the planners need to act on it. */
export class CohortMetric {
  code: string;
  title: string;
  reviewer: string;
  checksum: string;
  clicks: number;
  openRate: number;
  quantity: number;
  active: boolean;
  timezone: string;
  segment: string;
  attempts: number;
  status: CohortMetricStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    checksum: string,
    clicks: number,
    openRate: number,
    quantity: number,
    active: boolean,
    timezone: string,
    segment: string,
    attempts: number,
    status: CohortMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.clicks = clicks;
    this.openRate = openRate;
    this.quantity = quantity;
    this.active = active;
    this.timezone = timezone;
    this.segment = segment;
    this.attempts = attempts;
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

  canMoveTo(next: CohortMetricStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"cohort metric"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.quantity - this.attempts) * 100) / 100;
  }

  copy(): CohortMetric {
    return new CohortMetric(
      this.code,
      this.title,
      this.reviewer,
      this.checksum,
      this.clicks,
      this.openRate,
      this.quantity,
      this.active,
      this.timezone,
      this.segment,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a cohort metric in status open. */
export function newCohortMetric(code: string, title: string): CohortMetric {
  return new CohortMetric(code, title, "", "", 0, 0, 0, false, "", "", 0, "open");
}
