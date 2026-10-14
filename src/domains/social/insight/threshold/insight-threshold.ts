/**
 * The insight threshold records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight threshold is in its life cycle. */
export type InsightThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A insight threshold. Its code is unique within a tenant. */
export class InsightThreshold {
  code: string;
  name: string;
  cohort: string;
  createdAt: number;
  approved: boolean;
  utmSource: string;
  windowDays: number;
  journeyId: string;
  timezone: string;
  status: InsightThresholdStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    createdAt: number,
    approved: boolean,
    utmSource: string,
    windowDays: number,
    journeyId: string,
    timezone: string,
    status: InsightThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.approved = approved;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.journeyId = journeyId;
    this.timezone = timezone;
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

  canMoveTo(next: InsightThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"insight threshold"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.createdAt - this.windowDays) * 100) / 100;
  }

  copy(): InsightThreshold {
    return new InsightThreshold(
      this.code,
      this.name,
      this.cohort,
      this.createdAt,
      this.approved,
      this.utmSource,
      this.windowDays,
      this.journeyId,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a insight threshold in status idle. */
export function newInsightThreshold(code: string, name: string): InsightThreshold {
  return new InsightThreshold(code, name, "", 0, false, "", 0, "", "", "idle");
}
