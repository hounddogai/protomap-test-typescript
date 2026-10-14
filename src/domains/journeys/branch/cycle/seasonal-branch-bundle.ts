import * as text from "../../../../kit/text.js";

/** Where a seasonal branch bundle is in its life cycle. */
export type SeasonalBranchBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal branch bundle as the branch team keeps it. */
export class SeasonalBranchBundle {
  code: string;
  label: string;
  conversionRate: number;
  archived: boolean;
  durationMinutes: number;
  rate: number;
  status: SeasonalBranchBundleStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    archived: boolean,
    durationMinutes: number,
    rate: number,
    status: SeasonalBranchBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
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

  canMoveTo(next: SeasonalBranchBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalBranchBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal branch bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal branch bundle"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.durationMinutes - this.rate) * 100) / 100;
  }

  copy(): SeasonalBranchBundle {
    return new SeasonalBranchBundle(
      this.code,
      this.label,
      this.conversionRate,
      this.archived,
      this.durationMinutes,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal branch bundle in status idle. */
export function newSeasonalBranchBundle(code: string, label: string): SeasonalBranchBundle {
  return new SeasonalBranchBundle(code, label, 0, false, 0, 0, "idle");
}
