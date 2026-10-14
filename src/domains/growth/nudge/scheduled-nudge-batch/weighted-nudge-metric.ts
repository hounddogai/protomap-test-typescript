import * as text from "../../../../kit/text.js";

/** Where a weighted nudge metric is in its life cycle. */
export type WeightedNudgeMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted nudge metric as the nudge team keeps it. */
export class WeightedNudgeMetric {
  code: string;
  name: string;
  threshold: number;
  channel: string;
  windowDays: number;
  openRate: number;
  audienceId: string;
  status: WeightedNudgeMetricStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    channel: string,
    windowDays: number,
    openRate: number,
    audienceId: string,
    status: WeightedNudgeMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.channel = channel;
    this.windowDays = windowDays;
    this.openRate = openRate;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedNudgeMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedNudgeMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted nudge metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round(this.openRate * this.threshold * 100) / 100;
  }

  copy(): WeightedNudgeMetric {
    return new WeightedNudgeMetric(
      this.code,
      this.name,
      this.threshold,
      this.channel,
      this.windowDays,
      this.openRate,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted nudge metric in status proposed. */
export function newWeightedNudgeMetric(code: string, name: string): WeightedNudgeMetric {
  return new WeightedNudgeMetric(code, name, 0, "", 0, 0, "", "proposed");
}
