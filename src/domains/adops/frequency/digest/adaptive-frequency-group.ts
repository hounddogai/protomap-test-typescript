import * as text from "../../../../kit/text.js";

/** Where a adaptive frequency group is in its life cycle. */
export type AdaptiveFrequencyGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive frequency group. Its code is unique within a tenant. */
export class AdaptiveFrequencyGroup {
  code: string;
  label: string;
  quantity: number;
  cost: number;
  journeyId: string;
  unit: string;
  archived: boolean;
  status: AdaptiveFrequencyGroupStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    cost: number,
    journeyId: string,
    unit: string,
    archived: boolean,
    status: AdaptiveFrequencyGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.cost = cost;
    this.journeyId = journeyId;
    this.unit = unit;
    this.archived = archived;
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

  canMoveTo(next: AdaptiveFrequencyGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveFrequencyGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive frequency group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive frequency group"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.quantity - this.cost) * 100) / 100;
  }

  copy(): AdaptiveFrequencyGroup {
    return new AdaptiveFrequencyGroup(
      this.code,
      this.label,
      this.quantity,
      this.cost,
      this.journeyId,
      this.unit,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive frequency group in status idle. */
export function newAdaptiveFrequencyGroup(code: string, label: string): AdaptiveFrequencyGroup {
  return new AdaptiveFrequencyGroup(code, label, 0, 0, "", "", false, "idle");
}
