import * as text from "../../../../kit/text.js";

/** Where a weighted creative allocation is in its life cycle. */
export type WeightedCreativeAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted creative allocation. Its code is unique within a tenant. */
export class WeightedCreativeAllocation {
  code: string;
  name: string;
  locale: string;
  active: boolean;
  amount: number;
  expiresAt: number;
  clicks: number;
  status: WeightedCreativeAllocationStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    active: boolean,
    amount: number,
    expiresAt: number,
    clicks: number,
    status: WeightedCreativeAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.active = active;
    this.amount = amount;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedCreativeAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedCreativeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted creative allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round((this.expiresAt + this.clicks) * 100) / 100;
  }

  copy(): WeightedCreativeAllocation {
    return new WeightedCreativeAllocation(
      this.code,
      this.name,
      this.locale,
      this.active,
      this.amount,
      this.expiresAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted creative allocation in status open. */
export function newWeightedCreativeAllocation(code: string, name: string): WeightedCreativeAllocation {
  return new WeightedCreativeAllocation(code, name, "", false, 0, 0, 0, "open");
}
