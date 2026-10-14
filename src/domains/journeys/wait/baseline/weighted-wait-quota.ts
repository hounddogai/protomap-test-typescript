import * as text from "../../../../kit/text.js";

/** Where a weighted wait quota is in its life cycle. */
export type WeightedWaitQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted wait quota. Its code is unique within a tenant. */
export class WeightedWaitQuota {
  code: string;
  name: string;
  priority: number;
  durationMinutes: number;
  minimum: number;
  endsAt: number;
  amount: number;
  status: WeightedWaitQuotaStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    durationMinutes: number,
    minimum: number,
    endsAt: number,
    amount: number,
    status: WeightedWaitQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.amount = amount;
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

  canMoveTo(next: WeightedWaitQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedWaitQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted wait quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.endsAt + this.amount) * 100) / 100;
  }

  copy(): WeightedWaitQuota {
    return new WeightedWaitQuota(
      this.code,
      this.name,
      this.priority,
      this.durationMinutes,
      this.minimum,
      this.endsAt,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted wait quota in status proposed. */
export function newWeightedWaitQuota(code: string, name: string): WeightedWaitQuota {
  return new WeightedWaitQuota(code, name, 0, 0, 0, 0, 0, "proposed");
}
