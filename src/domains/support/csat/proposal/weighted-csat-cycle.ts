import * as text from "../../../../kit/text.js";

/** Where a weighted csat cycle is in its life cycle. */
export type WeightedCsatCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted csat cycle as the csat team keeps it. */
export class WeightedCsatCycle {
  code: string;
  name: string;
  timezone: string;
  revision: number;
  expiresAt: number;
  reviewer: string;
  currency: string;
  createdAt: number;
  checksum: string;
  status: WeightedCsatCycleStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    revision: number,
    expiresAt: number,
    reviewer: string,
    currency: string,
    createdAt: number,
    checksum: string,
    status: WeightedCsatCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.revision = revision;
    this.expiresAt = expiresAt;
    this.reviewer = reviewer;
    this.currency = currency;
    this.createdAt = createdAt;
    this.checksum = checksum;
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

  canMoveTo(next: WeightedCsatCycleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "done":
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

  moveTo(next: WeightedCsatCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted csat cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.revision - this.createdAt) * 100) / 100;
  }

  copy(): WeightedCsatCycle {
    return new WeightedCsatCycle(
      this.code,
      this.name,
      this.timezone,
      this.revision,
      this.expiresAt,
      this.reviewer,
      this.currency,
      this.createdAt,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted csat cycle in status new. */
export function newWeightedCsatCycle(code: string, name: string): WeightedCsatCycle {
  return new WeightedCsatCycle(code, name, "", 0, 0, "", "", 0, "", "new");
}
