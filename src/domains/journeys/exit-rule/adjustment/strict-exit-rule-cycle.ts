import * as text from "../../../../kit/text.js";

/** Where a strict exit rule cycle is in its life cycle. */
export type StrictExitRuleCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One strict exit rule cycle, with what the planners need to act on it. */
export class StrictExitRuleCycle {
  code: string;
  name: string;
  summary: string;
  cost: number;
  version: number;
  campaignRef: string;
  priority: number;
  phone: string;
  bid: number;
  limit: number;
  cohort: string;
  status: StrictExitRuleCycleStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    cost: number,
    version: number,
    campaignRef: string,
    priority: number,
    phone: string,
    bid: number,
    limit: number,
    cohort: string,
    status: StrictExitRuleCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.cost = cost;
    this.version = version;
    this.campaignRef = campaignRef;
    this.priority = priority;
    this.phone = phone;
    this.bid = bid;
    this.limit = limit;
    this.cohort = cohort;
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

  canMoveTo(next: StrictExitRuleCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StrictExitRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict exit rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.cost * this.priority * 100) / 100;
  }

  copy(): StrictExitRuleCycle {
    return new StrictExitRuleCycle(
      this.code,
      this.name,
      this.summary,
      this.cost,
      this.version,
      this.campaignRef,
      this.priority,
      this.phone,
      this.bid,
      this.limit,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict exit rule cycle in status proposed. */
export function newStrictExitRuleCycle(code: string, name: string): StrictExitRuleCycle {
  return new StrictExitRuleCycle(code, name, "", 0, 0, "", 0, "", 0, 0, "", "proposed");
}
