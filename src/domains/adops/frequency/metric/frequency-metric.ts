/**
 * The frequency metric records of adops's frequency work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a frequency metric is in its life cycle. */
export type FrequencyMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A frequency metric. Its code is unique within a tenant. */
export class FrequencyMetric {
  code: string;
  name: string;
  utmSource: string;
  variant: string;
  channel: string;
  clicks: number;
  timezone: string;
  status: FrequencyMetricStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    variant: string,
    channel: string,
    clicks: number,
    timezone: string,
    status: FrequencyMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.variant = variant;
    this.channel = channel;
    this.clicks = clicks;
    this.timezone = timezone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FrequencyMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"frequency metric"} ${this.code}`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): FrequencyMetric {
    return new FrequencyMetric(
      this.code,
      this.name,
      this.utmSource,
      this.variant,
      this.channel,
      this.clicks,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a frequency metric in status planned. */
export function newFrequencyMetric(code: string, name: string): FrequencyMetric {
  return new FrequencyMetric(code, name, "", "", "", 0, "", "planned");
}
