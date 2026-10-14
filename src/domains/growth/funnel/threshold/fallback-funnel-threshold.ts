/**
 * The fallback funnel threshold records of growth's funnel work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback funnel threshold is in its life cycle. */
export type FallbackFunnelThresholdStatus = "created" | "validated" | "published" | "retired";

/** A fallback funnel threshold. Its code is unique within a tenant. */
export class FallbackFunnelThreshold {
  code: string;
  title: string;
  visible: boolean;
  description: string;
  version: number;
  conversionRate: number;
  threshold: number;
  summary: string;
  timezone: string;
  variant: string;
  startsAt: number;
  status: FallbackFunnelThresholdStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    description: string,
    version: number,
    conversionRate: number,
    threshold: number,
    summary: string,
    timezone: string,
    variant: string,
    startsAt: number,
    status: FallbackFunnelThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.description = description;
    this.version = version;
    this.conversionRate = conversionRate;
    this.threshold = threshold;
    this.summary = summary;
    this.timezone = timezone;
    this.variant = variant;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackFunnelThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackFunnelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback funnel threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"fallback funnel threshold"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.startsAt + this.threshold) * 100) / 100;
  }

  copy(): FallbackFunnelThreshold {
    return new FallbackFunnelThreshold(
      this.code,
      this.title,
      this.visible,
      this.description,
      this.version,
      this.conversionRate,
      this.threshold,
      this.summary,
      this.timezone,
      this.variant,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback funnel threshold in status created. */
export function newFallbackFunnelThreshold(code: string, title: string): FallbackFunnelThreshold {
  return new FallbackFunnelThreshold(code, title, false, "", 0, 0, 0, "", "", "", 0, "created");
}
