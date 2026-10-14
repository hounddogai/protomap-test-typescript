import * as text from "../../../../kit/text.js";

/** Where a regional challenge cycle is in its life cycle. */
export type RegionalChallengeCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional challenge cycle. Its code is unique within a tenant. */
export class RegionalChallengeCycle {
  code: string;
  title: string;
  journeyId: string;
  currency: string;
  category: string;
  name: string;
  retries: number;
  bid: number;
  status: RegionalChallengeCycleStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    currency: string,
    category: string,
    name: string,
    retries: number,
    bid: number,
    status: RegionalChallengeCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.currency = currency;
    this.category = category;
    this.name = name;
    this.retries = retries;
    this.bid = bid;
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

  canMoveTo(next: RegionalChallengeCycleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done";
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

  moveTo(next: RegionalChallengeCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional challenge cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round(this.retries * this.bid * 100) / 100;
  }

  copy(): RegionalChallengeCycle {
    return new RegionalChallengeCycle(
      this.code,
      this.title,
      this.journeyId,
      this.currency,
      this.category,
      this.name,
      this.retries,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional challenge cycle in status new. */
export function newRegionalChallengeCycle(code: string, title: string): RegionalChallengeCycle {
  return new RegionalChallengeCycle(code, title, "", "", "", "", 0, 0, "new");
}
