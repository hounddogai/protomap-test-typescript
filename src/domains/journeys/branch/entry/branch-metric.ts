import * as text from "../../../../kit/text.js";

/** Where a branch metric is in its life cycle. */
export type BranchMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A branch metric as the branch team keeps it. */
export class BranchMetric {
  code: string;
  name: string;
  threshold: number;
  channel: string;
  impressions: number;
  margin: number;
  country: string;
  timezone: string;
  approved: boolean;
  ratio: number;
  limit: number;
  status: BranchMetricStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    channel: string,
    impressions: number,
    margin: number,
    country: string,
    timezone: string,
    approved: boolean,
    ratio: number,
    limit: number,
    status: BranchMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.channel = channel;
    this.impressions = impressions;
    this.margin = margin;
    this.country = country;
    this.timezone = timezone;
    this.approved = approved;
    this.ratio = ratio;
    this.limit = limit;
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

  canMoveTo(next: BranchMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BranchMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round((this.ratio - this.threshold) * 100) / 100;
  }

  copy(): BranchMetric {
    return new BranchMetric(
      this.code,
      this.name,
      this.threshold,
      this.channel,
      this.impressions,
      this.margin,
      this.country,
      this.timezone,
      this.approved,
      this.ratio,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a branch metric in status open. */
export function newBranchMetric(code: string, name: string): BranchMetric {
  return new BranchMetric(code, name, 0, "", 0, 0, "", "", false, 0, 0, "open");
}
