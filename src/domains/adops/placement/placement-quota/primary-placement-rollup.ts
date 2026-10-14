import * as text from "../../../../kit/text.js";

/** Where a primary placement rollup is in its life cycle. */
export type PrimaryPlacementRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One primary placement rollup, with what the planners need to act on it. */
export class PrimaryPlacementRollup {
  code: string;
  name: string;
  frequencyCap: number;
  cost: number;
  locale: string;
  bid: number;
  channel: string;
  floorValue: number;
  budget: number;
  openRate: number;
  conversionRate: number;
  status: PrimaryPlacementRollupStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    cost: number,
    locale: string,
    bid: number,
    channel: string,
    floorValue: number,
    budget: number,
    openRate: number,
    conversionRate: number,
    status: PrimaryPlacementRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.locale = locale;
    this.bid = bid;
    this.channel = channel;
    this.floorValue = floorValue;
    this.budget = budget;
    this.openRate = openRate;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: PrimaryPlacementRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryPlacementRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary placement rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedLoad(): number {
    return Math.round((this.budget - this.floorValue) * 100) / 100;
  }

  copy(): PrimaryPlacementRollup {
    return new PrimaryPlacementRollup(
      this.code,
      this.name,
      this.frequencyCap,
      this.cost,
      this.locale,
      this.bid,
      this.channel,
      this.floorValue,
      this.budget,
      this.openRate,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary placement rollup in status proposed. */
export function newPrimaryPlacementRollup(code: string, name: string): PrimaryPlacementRollup {
  return new PrimaryPlacementRollup(code, name, 0, 0, "", 0, "", 0, 0, 0, 0, "proposed");
}
