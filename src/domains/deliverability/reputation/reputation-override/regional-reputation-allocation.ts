import * as text from "../../../../kit/text.js";

/** Where a regional reputation allocation is in its life cycle. */
export type RegionalReputationAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One regional reputation allocation, with what the planners need to act on it. */
export class RegionalReputationAllocation {
  code: string;
  label: string;
  pinned: boolean;
  score: number;
  name: string;
  source: string;
  startsAt: number;
  bid: number;
  ratio: number;
  status: RegionalReputationAllocationStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    score: number,
    name: string,
    source: string,
    startsAt: number,
    bid: number,
    ratio: number,
    status: RegionalReputationAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.score = score;
    this.name = name;
    this.source = source;
    this.startsAt = startsAt;
    this.bid = bid;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalReputationAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalReputationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reputation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.bid + this.ratio) * 100) / 100;
  }

  copy(): RegionalReputationAllocation {
    return new RegionalReputationAllocation(
      this.code,
      this.label,
      this.pinned,
      this.score,
      this.name,
      this.source,
      this.startsAt,
      this.bid,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional reputation allocation in status draft. */
export function newRegionalReputationAllocation(code: string, label: string): RegionalReputationAllocation {
  return new RegionalReputationAllocation(code, label, false, 0, "", "", 0, 0, 0, "draft");
}
