import * as text from "../../../../kit/text.js";

/** Where a regional credit request is in its life cycle. */
export type RegionalCreditRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One regional credit request, with what the planners need to act on it. */
export class RegionalCreditRequest {
  code: string;
  name: string;
  amount: number;
  campaignRef: string;
  locale: string;
  graceDays: number;
  discount: number;
  clicks: number;
  minimum: number;
  status: RegionalCreditRequestStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    campaignRef: string,
    locale: string,
    graceDays: number,
    discount: number,
    clicks: number,
    minimum: number,
    status: RegionalCreditRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.graceDays = graceDays;
    this.discount = discount;
    this.clicks = clicks;
    this.minimum = minimum;
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

  canMoveTo(next: RegionalCreditRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalCreditRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional credit request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round(this.amount * this.graceDays * 100) / 100;
  }

  copy(): RegionalCreditRequest {
    return new RegionalCreditRequest(
      this.code,
      this.name,
      this.amount,
      this.campaignRef,
      this.locale,
      this.graceDays,
      this.discount,
      this.clicks,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional credit request in status new. */
export function newRegionalCreditRequest(code: string, name: string): RegionalCreditRequest {
  return new RegionalCreditRequest(code, name, 0, "", "", 0, 0, 0, 0, "new");
}
