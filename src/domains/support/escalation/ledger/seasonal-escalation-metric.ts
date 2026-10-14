import * as text from "../../../../kit/text.js";

/** Where a seasonal escalation metric is in its life cycle. */
export type SeasonalEscalationMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal escalation metric, with what the planners need to act on it. */
export class SeasonalEscalationMetric {
  code: string;
  label: string;
  channel: string;
  minimum: number;
  variant: string;
  retries: number;
  capacity: number;
  region: string;
  country: string;
  status: SeasonalEscalationMetricStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    minimum: number,
    variant: string,
    retries: number,
    capacity: number,
    region: string,
    country: string,
    status: SeasonalEscalationMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.minimum = minimum;
    this.variant = variant;
    this.retries = retries;
    this.capacity = capacity;
    this.region = region;
    this.country = country;
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

  canMoveTo(next: SeasonalEscalationMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalEscalationMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal escalation metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round(this.capacity * this.minimum * 100) / 100;
  }

  copy(): SeasonalEscalationMetric {
    return new SeasonalEscalationMetric(
      this.code,
      this.label,
      this.channel,
      this.minimum,
      this.variant,
      this.retries,
      this.capacity,
      this.region,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal escalation metric in status draft. */
export function newSeasonalEscalationMetric(code: string, label: string): SeasonalEscalationMetric {
  return new SeasonalEscalationMetric(code, label, "", 0, "", 0, 0, "", "", "draft");
}
