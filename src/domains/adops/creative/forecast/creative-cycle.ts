import * as text from "../../../../kit/text.js";

/** Where a creative cycle is in its life cycle. */
export type CreativeCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a creative cycle and its current status. */
export class CreativeCycle {
  code: string;
  name: string;
  clicks: number;
  impressions: number;
  quantity: number;
  maximum: number;
  category: string;
  status: CreativeCycleStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    impressions: number,
    quantity: number,
    maximum: number,
    category: string,
    status: CreativeCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.impressions = impressions;
    this.quantity = quantity;
    this.maximum = maximum;
    this.category = category;
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

  canMoveTo(next: CreativeCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"creative cycle"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.quantity - this.maximum) * 100) / 100;
  }

  copy(): CreativeCycle {
    return new CreativeCycle(
      this.code,
      this.name,
      this.clicks,
      this.impressions,
      this.quantity,
      this.maximum,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a creative cycle in status new. */
export function newCreativeCycle(code: string, name: string): CreativeCycle {
  return new CreativeCycle(code, name, 0, 0, 0, 0, "", "new");
}
