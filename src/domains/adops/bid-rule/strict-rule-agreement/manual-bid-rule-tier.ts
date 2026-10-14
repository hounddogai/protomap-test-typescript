import * as text from "../../../../kit/text.js";

/** Where a manual bid rule tier is in its life cycle. */
export type ManualBidRuleTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** One manual bid rule tier, with what the planners need to act on it. */
export class ManualBidRuleTier {
  code: string;
  name: string;
  maximum: number;
  country: string;
  amount: number;
  status: ManualBidRuleTierStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    country: string,
    amount: number,
    status: ManualBidRuleTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.country = country;
    this.amount = amount;
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

  canMoveTo(next: ManualBidRuleTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualBidRuleTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bid rule tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round((this.maximum - this.amount) * 100) / 100;
  }

  copy(): ManualBidRuleTier {
    return new ManualBidRuleTier(this.code, this.name, this.maximum, this.country, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual bid rule tier in status new. */
export function newManualBidRuleTier(code: string, name: string): ManualBidRuleTier {
  return new ManualBidRuleTier(code, name, 0, "", 0, "new");
}
