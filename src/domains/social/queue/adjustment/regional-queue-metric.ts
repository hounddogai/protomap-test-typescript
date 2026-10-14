import * as text from "../../../../kit/text.js";

/** Where a regional queue metric is in its life cycle. */
export type RegionalQueueMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional queue metric. Its code is unique within a tenant. */
export class RegionalQueueMetric {
  code: string;
  title: string;
  attempts: number;
  endsAt: number;
  rate: number;
  status: RegionalQueueMetricStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    endsAt: number,
    rate: number,
    status: RegionalQueueMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.rate = rate;
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

  canMoveTo(next: RegionalQueueMetricStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalQueueMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional queue metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional queue metric"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.endsAt - this.rate) * 100) / 100;
  }

  copy(): RegionalQueueMetric {
    return new RegionalQueueMetric(this.code, this.title, this.attempts, this.endsAt, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional queue metric in status new. */
export function newRegionalQueueMetric(code: string, title: string): RegionalQueueMetric {
  return new RegionalQueueMetric(code, title, 0, 0, 0, "new");
}
