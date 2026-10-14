/**
 * The fallback pacing metric records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback pacing metric is in its life cycle. */
export type FallbackPacingMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback pacing metric, with what the planners need to act on it. */
export class FallbackPacingMetric {
  code: string;
  title: string;
  utmSource: string;
  summary: string;
  version: number;
  durationMinutes: number;
  timezone: string;
  status: FallbackPacingMetricStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    summary: string,
    version: number,
    durationMinutes: number,
    timezone: string,
    status: FallbackPacingMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.summary = summary;
    this.version = version;
    this.durationMinutes = durationMinutes;
    this.timezone = timezone;
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

  canMoveTo(next: FallbackPacingMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackPacingMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback pacing metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"fallback pacing metric"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.durationMinutes * this.version * 100) / 100;
  }

  copy(): FallbackPacingMetric {
    return new FallbackPacingMetric(
      this.code,
      this.title,
      this.utmSource,
      this.summary,
      this.version,
      this.durationMinutes,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback pacing metric in status open. */
export function newFallbackPacingMetric(code: string, title: string): FallbackPacingMetric {
  return new FallbackPacingMetric(code, title, "", "", 0, 0, "", "open");
}
