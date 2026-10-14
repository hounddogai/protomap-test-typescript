/**
 * The lenient reply metric records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient reply metric is in its life cycle. */
export type LenientReplyMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient reply metric as the reply team keeps it. */
export class LenientReplyMetric {
  code: string;
  name: string;
  capacity: number;
  conversionRate: number;
  locale: string;
  journeyId: string;
  sequence: number;
  audienceId: string;
  status: LenientReplyMetricStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    conversionRate: number,
    locale: string,
    journeyId: string,
    sequence: number,
    audienceId: string,
    status: LenientReplyMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.journeyId = journeyId;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientReplyMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientReplyMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reply metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.capacity + this.sequence) * 100) / 100;
  }

  copy(): LenientReplyMetric {
    return new LenientReplyMetric(
      this.code,
      this.name,
      this.capacity,
      this.conversionRate,
      this.locale,
      this.journeyId,
      this.sequence,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient reply metric in status idle. */
export function newLenientReplyMetric(code: string, name: string): LenientReplyMetric {
  return new LenientReplyMetric(code, name, 0, 0, "", "", 0, "", "idle");
}
