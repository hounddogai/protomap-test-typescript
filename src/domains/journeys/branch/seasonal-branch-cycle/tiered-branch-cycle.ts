import * as text from "../../../../kit/text.js";

/** Where a tiered branch cycle is in its life cycle. */
export type TieredBranchCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a tiered branch cycle and its current status. */
export class TieredBranchCycle {
  code: string;
  name: string;
  ratio: number;
  floorValue: number;
  label: string;
  maximum: number;
  source: string;
  timezone: string;
  windowDays: number;
  quantity: number;
  clicks: number;
  status: TieredBranchCycleStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    floorValue: number,
    label: string,
    maximum: number,
    source: string,
    timezone: string,
    windowDays: number,
    quantity: number,
    clicks: number,
    status: TieredBranchCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.floorValue = floorValue;
    this.label = label;
    this.maximum = maximum;
    this.source = source;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.clicks = clicks;
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

  canMoveTo(next: TieredBranchCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredBranchCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered branch cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered branch cycle"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.clicks - this.maximum) * 100) / 100;
  }

  copy(): TieredBranchCycle {
    return new TieredBranchCycle(
      this.code,
      this.name,
      this.ratio,
      this.floorValue,
      this.label,
      this.maximum,
      this.source,
      this.timezone,
      this.windowDays,
      this.quantity,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered branch cycle in status planned. */
export function newTieredBranchCycle(code: string, name: string): TieredBranchCycle {
  return new TieredBranchCycle(code, name, 0, 0, "", 0, "", "", 0, 0, 0, "planned");
}
