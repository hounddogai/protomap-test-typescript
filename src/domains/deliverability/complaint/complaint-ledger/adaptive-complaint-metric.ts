import * as text from "../../../../kit/text.js";

/** Where a adaptive complaint metric is in its life cycle. */
export type AdaptiveComplaintMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** One adaptive complaint metric, with what the planners need to act on it. */
export class AdaptiveComplaintMetric {
  code: string;
  name: string;
  locale: string;
  threshold: number;
  sequence: number;
  timezone: string;
  rate: number;
  limit: number;
  cohort: string;
  ownerId: string;
  status: AdaptiveComplaintMetricStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    threshold: number,
    sequence: number,
    timezone: string,
    rate: number,
    limit: number,
    cohort: string,
    ownerId: string,
    status: AdaptiveComplaintMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.threshold = threshold;
    this.sequence = sequence;
    this.timezone = timezone;
    this.rate = rate;
    this.limit = limit;
    this.cohort = cohort;
    this.ownerId = ownerId;
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

  canMoveTo(next: AdaptiveComplaintMetricStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptiveComplaintMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive complaint metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.rate + this.sequence) * 100) / 100;
  }

  copy(): AdaptiveComplaintMetric {
    return new AdaptiveComplaintMetric(
      this.code,
      this.name,
      this.locale,
      this.threshold,
      this.sequence,
      this.timezone,
      this.rate,
      this.limit,
      this.cohort,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive complaint metric in status new. */
export function newAdaptiveComplaintMetric(code: string, name: string): AdaptiveComplaintMetric {
  return new AdaptiveComplaintMetric(code, name, "", 0, 0, "", 0, 0, "", "", "new");
}
