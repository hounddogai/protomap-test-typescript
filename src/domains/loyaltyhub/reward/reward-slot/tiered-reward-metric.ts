import * as text from "../../../../kit/text.js";

/** Where a tiered reward metric is in its life cycle. */
export type TieredRewardMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered reward metric as the reward team keeps it. */
export class TieredRewardMetric {
  code: string;
  label: string;
  phone: string;
  threshold: number;
  startsAt: number;
  cohort: string;
  status: TieredRewardMetricStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    threshold: number,
    startsAt: number,
    cohort: string,
    status: TieredRewardMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredRewardMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredRewardMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered reward metric"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.threshold * this.startsAt * 100) / 100;
  }

  copy(): TieredRewardMetric {
    return new TieredRewardMetric(
      this.code,
      this.label,
      this.phone,
      this.threshold,
      this.startsAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered reward metric in status requested. */
export function newTieredRewardMetric(code: string, label: string): TieredRewardMetric {
  return new TieredRewardMetric(code, label, "", 0, 0, "", "requested");
}
