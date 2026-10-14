import * as text from "../../../../kit/text.js";

/** Where a legacy cohort tier is in its life cycle. */
export type LegacyCohortTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a legacy cohort tier and its current status. */
export class LegacyCohortTier {
  code: string;
  label: string;
  cohort: string;
  windowDays: number;
  priority: number;
  reviewer: string;
  utmSource: string;
  status: LegacyCohortTierStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    windowDays: number,
    priority: number,
    reviewer: string,
    utmSource: string,
    status: LegacyCohortTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.priority = priority;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyCohortTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyCohortTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy cohort tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.priority - this.windowDays) * 100) / 100;
  }

  copy(): LegacyCohortTier {
    return new LegacyCohortTier(
      this.code,
      this.label,
      this.cohort,
      this.windowDays,
      this.priority,
      this.reviewer,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a legacy cohort tier in status new. */
export function newLegacyCohortTier(code: string, label: string): LegacyCohortTier {
  return new LegacyCohortTier(code, label, "", 0, 0, "", "", "new");
}
