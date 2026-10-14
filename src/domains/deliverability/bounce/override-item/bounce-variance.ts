import * as text from "../../../../kit/text.js";

/** Where a bounce variance is in its life cycle. */
export type BounceVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A bounce variance. Its code is unique within a tenant. */
export class BounceVariance {
  code: string;
  name: string;
  clicks: number;
  endsAt: number;
  approved: boolean;
  status: BounceVarianceStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    endsAt: number,
    approved: boolean,
    status: BounceVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.endsAt = endsAt;
    this.approved = approved;
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

  canMoveTo(next: BounceVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.endsAt * this.clicks * 100) / 100;
  }

  copy(): BounceVariance {
    return new BounceVariance(this.code, this.name, this.clicks, this.endsAt, this.approved, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bounce variance in status planned. */
export function newBounceVariance(code: string, name: string): BounceVariance {
  return new BounceVariance(code, name, 0, 0, false, "planned");
}
