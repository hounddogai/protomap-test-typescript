import * as text from "../../../../kit/text.js";

/** Where a lenient reward rule milestone is in its life cycle. */
export type LenientRewardRuleMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient reward rule milestone. Its code is unique within a tenant. */
export class LenientRewardRuleMilestone {
  code: string;
  title: string;
  bid: number;
  capacity: number;
  revision: number;
  status: LenientRewardRuleMilestoneStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    capacity: number,
    revision: number,
    status: LenientRewardRuleMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.capacity = capacity;
    this.revision = revision;
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

  canMoveTo(next: LenientRewardRuleMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
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

  moveTo(next: LenientRewardRuleMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward rule milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round(this.bid * this.capacity * 100) / 100;
  }

  copy(): LenientRewardRuleMilestone {
    return new LenientRewardRuleMilestone(this.code, this.title, this.bid, this.capacity, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient reward rule milestone in status requested. */
export function newLenientRewardRuleMilestone(code: string, title: string): LenientRewardRuleMilestone {
  return new LenientRewardRuleMilestone(code, title, 0, 0, 0, "requested");
}
