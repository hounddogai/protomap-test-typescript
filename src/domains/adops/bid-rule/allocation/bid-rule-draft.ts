import * as text from "../../../../kit/text.js";

/** Where a bid rule draft is in its life cycle. */
export type BidRuleDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A bid rule draft. Its code is unique within a tenant. */
export class BidRuleDraft {
  code: string;
  title: string;
  variant: string;
  journeyId: string;
  region: string;
  score: number;
  status: BidRuleDraftStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    journeyId: string,
    region: string,
    score: number,
    status: BidRuleDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.journeyId = journeyId;
    this.region = region;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BidRuleDraft {
    return new BidRuleDraft(this.code, this.title, this.variant, this.journeyId, this.region, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a bid rule draft in status idle. */
export function newBidRuleDraft(code: string, title: string): BidRuleDraft {
  return new BidRuleDraft(code, title, "", "", "", 0, "idle");
}
