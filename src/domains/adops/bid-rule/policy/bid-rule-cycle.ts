import * as text from "../../../../kit/text.js";

/** Where a bid rule cycle is in its life cycle. */
export type BidRuleCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** One bid rule cycle, with what the planners need to act on it. */
export class BidRuleCycle {
  code: string;
  label: string;
  unit: string;
  approved: boolean;
  archived: boolean;
  utmSource: string;
  windowDays: number;
  ownerId: string;
  source: string;
  weight: number;
  cohort: string;
  status: BidRuleCycleStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    approved: boolean,
    archived: boolean,
    utmSource: string,
    windowDays: number,
    ownerId: string,
    source: string,
    weight: number,
    cohort: string,
    status: BidRuleCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.approved = approved;
    this.archived = archived;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.source = source;
    this.weight = weight;
    this.cohort = cohort;
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

  canMoveTo(next: BidRuleCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"bid rule cycle"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.weight + this.windowDays) * 100) / 100;
  }

  copy(): BidRuleCycle {
    return new BidRuleCycle(
      this.code,
      this.label,
      this.unit,
      this.approved,
      this.archived,
      this.utmSource,
      this.windowDays,
      this.ownerId,
      this.source,
      this.weight,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a bid rule cycle in status requested. */
export function newBidRuleCycle(code: string, label: string): BidRuleCycle {
  return new BidRuleCycle(code, label, "", false, false, "", 0, "", "", 0, "", "requested");
}
