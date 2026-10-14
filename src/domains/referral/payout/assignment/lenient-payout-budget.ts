import * as text from "../../../../kit/text.js";

/** Where a lenient payout budget is in its life cycle. */
export type LenientPayoutBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient payout budget and its current status. */
export class LenientPayoutBudget {
  code: string;
  name: string;
  weight: number;
  maximum: number;
  unit: string;
  title: string;
  archived: boolean;
  checksum: string;
  approved: boolean;
  margin: number;
  status: LenientPayoutBudgetStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    maximum: number,
    unit: string,
    title: string,
    archived: boolean,
    checksum: string,
    approved: boolean,
    margin: number,
    status: LenientPayoutBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.maximum = maximum;
    this.unit = unit;
    this.title = title;
    this.archived = archived;
    this.checksum = checksum;
    this.approved = approved;
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

  canMoveTo(next: LenientPayoutBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPayoutBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient payout budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient payout budget"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.margin * this.weight * 100) / 100;
  }

  copy(): LenientPayoutBudget {
    return new LenientPayoutBudget(
      this.code,
      this.name,
      this.weight,
      this.maximum,
      this.unit,
      this.title,
      this.archived,
      this.checksum,
      this.approved,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient payout budget in status idle. */
export function newLenientPayoutBudget(code: string, name: string): LenientPayoutBudget {
  return new LenientPayoutBudget(code, name, 0, 0, "", "", false, "", false, 0, "idle");
}
