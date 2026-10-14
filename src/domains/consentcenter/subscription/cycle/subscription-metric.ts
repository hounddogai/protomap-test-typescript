import * as text from "../../../../kit/text.js";

/** Where a subscription metric is in its life cycle. */
export type SubscriptionMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One subscription metric, with what the planners need to act on it. */
export class SubscriptionMetric {
  code: string;
  name: string;
  segment: string;
  version: number;
  clicks: number;
  minimum: number;
  externalRef: string;
  durationMinutes: number;
  sendAt: number;
  score: number;
  channel: string;
  status: SubscriptionMetricStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    version: number,
    clicks: number,
    minimum: number,
    externalRef: string,
    durationMinutes: number,
    sendAt: number,
    score: number,
    channel: string,
    status: SubscriptionMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.version = version;
    this.clicks = clicks;
    this.minimum = minimum;
    this.externalRef = externalRef;
    this.durationMinutes = durationMinutes;
    this.sendAt = sendAt;
    this.score = score;
    this.channel = channel;
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

  canMoveTo(next: SubscriptionMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SubscriptionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round(this.sendAt * this.score * 100) / 100;
  }

  copy(): SubscriptionMetric {
    return new SubscriptionMetric(
      this.code,
      this.name,
      this.segment,
      this.version,
      this.clicks,
      this.minimum,
      this.externalRef,
      this.durationMinutes,
      this.sendAt,
      this.score,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a subscription metric in status proposed. */
export function newSubscriptionMetric(code: string, name: string): SubscriptionMetric {
  return new SubscriptionMetric(code, name, "", 0, 0, 0, "", 0, 0, 0, "", "proposed");
}
