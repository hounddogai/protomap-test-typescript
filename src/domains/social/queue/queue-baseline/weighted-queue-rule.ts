import * as text from "../../../../kit/text.js";

/** Where a weighted queue rule is in its life cycle. */
export type WeightedQueueRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted queue rule. Its code is unique within a tenant. */
export class WeightedQueueRule {
  code: string;
  title: string;
  quantity: number;
  timezone: string;
  frequencyCap: number;
  floorValue: number;
  ownerId: string;
  cost: number;
  status: WeightedQueueRuleStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    timezone: string,
    frequencyCap: number,
    floorValue: number,
    ownerId: string,
    cost: number,
    status: WeightedQueueRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
    this.cost = cost;
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

  canMoveTo(next: WeightedQueueRuleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedQueueRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted queue rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted queue rule"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.frequencyCap - this.floorValue) * 100) / 100;
  }

  copy(): WeightedQueueRule {
    return new WeightedQueueRule(
      this.code,
      this.title,
      this.quantity,
      this.timezone,
      this.frequencyCap,
      this.floorValue,
      this.ownerId,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted queue rule in status new. */
export function newWeightedQueueRule(code: string, title: string): WeightedQueueRule {
  return new WeightedQueueRule(code, title, 0, "", 0, 0, "", 0, "new");
}
