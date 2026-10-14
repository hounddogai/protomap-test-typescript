/**
 * The scheduled sla baseline records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled sla baseline is in its life cycle. */
export type ScheduledSlaBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled sla baseline as the sla team keeps it. */
export class ScheduledSlaBaseline {
  code: string;
  title: string;
  ceiling: number;
  journeyId: string;
  unit: string;
  openRate: number;
  summary: string;
  batchSize: number;
  graceDays: number;
  status: ScheduledSlaBaselineStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    journeyId: string,
    unit: string,
    openRate: number,
    summary: string,
    batchSize: number,
    graceDays: number,
    status: ScheduledSlaBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.journeyId = journeyId;
    this.unit = unit;
    this.openRate = openRate;
    this.summary = summary;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
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

  canMoveTo(next: ScheduledSlaBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledSlaBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sla baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled sla baseline"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.batchSize * this.openRate * 100) / 100;
  }

  copy(): ScheduledSlaBaseline {
    return new ScheduledSlaBaseline(
      this.code,
      this.title,
      this.ceiling,
      this.journeyId,
      this.unit,
      this.openRate,
      this.summary,
      this.batchSize,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled sla baseline in status proposed. */
export function newScheduledSlaBaseline(code: string, title: string): ScheduledSlaBaseline {
  return new ScheduledSlaBaseline(code, title, 0, "", "", 0, "", 0, 0, "proposed");
}
