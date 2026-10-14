import * as text from "../../../../kit/text.js";

/** Where a payout plan is in its life cycle. */
export type PayoutPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A payout plan. Its code is unique within a tenant. */
export class PayoutPlan {
  code: string;
  name: string;
  score: number;
  summary: string;
  active: boolean;
  status: PayoutPlanStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    summary: string,
    active: boolean,
    status: PayoutPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.summary = summary;
    this.active = active;
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

  canMoveTo(next: PayoutPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
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

  moveTo(next: PayoutPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"payout plan"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PayoutPlan {
    return new PayoutPlan(this.code, this.name, this.score, this.summary, this.active, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a payout plan in status requested. */
export function newPayoutPlan(code: string, name: string): PayoutPlan {
  return new PayoutPlan(code, name, 0, "", false, "requested");
}
