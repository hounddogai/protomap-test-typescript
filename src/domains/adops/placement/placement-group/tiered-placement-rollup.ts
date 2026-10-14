import * as text from "../../../../kit/text.js";

/** Where a tiered placement rollup is in its life cycle. */
export type TieredPlacementRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered placement rollup as the placement team keeps it. */
export class TieredPlacementRollup {
  code: string;
  name: string;
  graceDays: number;
  region: string;
  minimum: number;
  expiresAt: number;
  attempts: number;
  approved: boolean;
  reviewer: string;
  createdAt: number;
  phone: string;
  status: TieredPlacementRollupStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    region: string,
    minimum: number,
    expiresAt: number,
    attempts: number,
    approved: boolean,
    reviewer: string,
    createdAt: number,
    phone: string,
    status: TieredPlacementRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.region = region;
    this.minimum = minimum;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.approved = approved;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
    this.phone = phone;
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

  canMoveTo(next: TieredPlacementRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: TieredPlacementRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered placement rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered placement rollup"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.expiresAt + this.attempts) * 100) / 100;
  }

  copy(): TieredPlacementRollup {
    return new TieredPlacementRollup(
      this.code,
      this.name,
      this.graceDays,
      this.region,
      this.minimum,
      this.expiresAt,
      this.attempts,
      this.approved,
      this.reviewer,
      this.createdAt,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered placement rollup in status idle. */
export function newTieredPlacementRollup(code: string, name: string): TieredPlacementRollup {
  return new TieredPlacementRollup(code, name, 0, "", 0, 0, 0, false, "", 0, "", "idle");
}
