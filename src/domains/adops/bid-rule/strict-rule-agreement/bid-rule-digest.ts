import * as text from "../../../../kit/text.js";

/** Where a bid rule digest is in its life cycle. */
export type BidRuleDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One bid rule digest, with what the planners need to act on it. */
export class BidRuleDigest {
  code: string;
  title: string;
  frequencyCap: number;
  margin: number;
  openRate: number;
  status: BidRuleDigestStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    margin: number,
    openRate: number,
    status: BidRuleDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.margin = margin;
    this.openRate = openRate;
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

  canMoveTo(next: BidRuleDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: BidRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"bid rule digest"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.margin + this.frequencyCap) * 100) / 100;
  }

  copy(): BidRuleDigest {
    return new BidRuleDigest(this.code, this.title, this.frequencyCap, this.margin, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bid rule digest in status draft. */
export function newBidRuleDigest(code: string, title: string): BidRuleDigest {
  return new BidRuleDigest(code, title, 0, 0, 0, "draft");
}
