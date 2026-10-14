import * as text from "../../../../kit/text.js";

/** Where a tiered tier baseline is in its life cycle. */
export type TieredTierBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered tier baseline as the tier team keeps it. */
export class TieredTierBaseline {
  code: string;
  name: string;
  phone: string;
  ceiling: number;
  weight: number;
  reviewer: string;
  startsAt: number;
  bid: number;
  attempts: number;
  status: TieredTierBaselineStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    ceiling: number,
    weight: number,
    reviewer: string,
    startsAt: number,
    bid: number,
    attempts: number,
    status: TieredTierBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.ceiling = ceiling;
    this.weight = weight;
    this.reviewer = reviewer;
    this.startsAt = startsAt;
    this.bid = bid;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredTierBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredTierBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered tier baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.attempts + this.weight) * 100) / 100;
  }

  copy(): TieredTierBaseline {
    return new TieredTierBaseline(
      this.code,
      this.name,
      this.phone,
      this.ceiling,
      this.weight,
      this.reviewer,
      this.startsAt,
      this.bid,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered tier baseline in status planned. */
export function newTieredTierBaseline(code: string, name: string): TieredTierBaseline {
  return new TieredTierBaseline(code, name, "", 0, 0, "", 0, 0, 0, "planned");
}
