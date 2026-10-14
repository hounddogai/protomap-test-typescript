/**
 * The journey metric records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey metric is in its life cycle. */
export type JourneyMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a journey metric and its current status. */
export class JourneyMetric {
  code: string;
  name: string;
  impressions: number;
  graceDays: number;
  variant: string;
  title: string;
  conversionRate: number;
  status: JourneyMetricStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    graceDays: number,
    variant: string,
    title: string,
    conversionRate: number,
    status: JourneyMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.graceDays = graceDays;
    this.variant = variant;
    this.title = title;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: JourneyMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: JourneyMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round(this.graceDays * this.conversionRate * 100) / 100;
  }

  copy(): JourneyMetric {
    return new JourneyMetric(
      this.code,
      this.name,
      this.impressions,
      this.graceDays,
      this.variant,
      this.title,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a journey metric in status planned. */
export function newJourneyMetric(code: string, name: string): JourneyMetric {
  return new JourneyMetric(code, name, 0, 0, "", "", 0, "planned");
}
