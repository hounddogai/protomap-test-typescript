import * as text from "../../../../kit/text.js";

/** Where a regional streak rollup is in its life cycle. */
export type RegionalStreakRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** One regional streak rollup, with what the planners need to act on it. */
export class RegionalStreakRollup {
  code: string;
  label: string;
  notes: string;
  budget: number;
  batchSize: number;
  rate: number;
  bid: number;
  quantity: number;
  startsAt: number;
  name: string;
  channel: string;
  status: RegionalStreakRollupStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    budget: number,
    batchSize: number,
    rate: number,
    bid: number,
    quantity: number,
    startsAt: number,
    name: string,
    channel: string,
    status: RegionalStreakRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.budget = budget;
    this.batchSize = batchSize;
    this.rate = rate;
    this.bid = bid;
    this.quantity = quantity;
    this.startsAt = startsAt;
    this.name = name;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalStreakRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalStreakRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional streak rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional streak rollup"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.startsAt + this.budget) * 100) / 100;
  }

  copy(): RegionalStreakRollup {
    return new RegionalStreakRollup(
      this.code,
      this.label,
      this.notes,
      this.budget,
      this.batchSize,
      this.rate,
      this.bid,
      this.quantity,
      this.startsAt,
      this.name,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional streak rollup in status requested. */
export function newRegionalStreakRollup(code: string, label: string): RegionalStreakRollup {
  return new RegionalStreakRollup(code, label, "", 0, 0, 0, 0, 0, 0, "", "", "requested");
}
