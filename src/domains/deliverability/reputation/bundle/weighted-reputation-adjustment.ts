import * as text from "../../../../kit/text.js";

/** Where a weighted reputation adjustment is in its life cycle. */
export type WeightedReputationAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One weighted reputation adjustment, with what the planners need to act on it. */
export class WeightedReputationAdjustment {
  code: string;
  name: string;
  ratio: number;
  quantity: number;
  ceiling: number;
  currency: string;
  margin: number;
  status: WeightedReputationAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    quantity: number,
    ceiling: number,
    currency: string,
    margin: number,
    status: WeightedReputationAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.quantity = quantity;
    this.ceiling = ceiling;
    this.currency = currency;
    this.margin = margin;
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

  canMoveTo(next: WeightedReputationAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedReputationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reputation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted reputation adjustment"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.quantity * this.ratio * 100) / 100;
  }

  copy(): WeightedReputationAdjustment {
    return new WeightedReputationAdjustment(
      this.code,
      this.name,
      this.ratio,
      this.quantity,
      this.ceiling,
      this.currency,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted reputation adjustment in status idle. */
export function newWeightedReputationAdjustment(code: string, name: string): WeightedReputationAdjustment {
  return new WeightedReputationAdjustment(code, name, 0, 0, 0, "", 0, "idle");
}
