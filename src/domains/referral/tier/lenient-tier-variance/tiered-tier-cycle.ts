import * as text from "../../../../kit/text.js";

/** Where a tiered tier cycle is in its life cycle. */
export type TieredTierCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered tier cycle as the tier team keeps it. */
export class TieredTierCycle {
  code: string;
  label: string;
  budget: number;
  minimum: number;
  region: string;
  endsAt: number;
  segment: string;
  ceiling: number;
  status: TieredTierCycleStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    minimum: number,
    region: string,
    endsAt: number,
    segment: string,
    ceiling: number,
    status: TieredTierCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.minimum = minimum;
    this.region = region;
    this.endsAt = endsAt;
    this.segment = segment;
    this.ceiling = ceiling;
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

  canMoveTo(next: TieredTierCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: TieredTierCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered tier cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered tier cycle"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.budget + this.endsAt) * 100) / 100;
  }

  copy(): TieredTierCycle {
    return new TieredTierCycle(
      this.code,
      this.label,
      this.budget,
      this.minimum,
      this.region,
      this.endsAt,
      this.segment,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered tier cycle in status idle. */
export function newTieredTierCycle(code: string, label: string): TieredTierCycle {
  return new TieredTierCycle(code, label, 0, 0, "", 0, "", 0, "idle");
}
