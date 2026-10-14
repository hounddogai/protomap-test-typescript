import * as text from "../../../../kit/text.js";

/** Where a lenient invite estimate is in its life cycle. */
export type LenientInviteEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient invite estimate. Its code is unique within a tenant. */
export class LenientInviteEstimate {
  code: string;
  title: string;
  approved: boolean;
  summary: string;
  journeyId: string;
  amount: number;
  status: LenientInviteEstimateStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    summary: string,
    journeyId: string,
    amount: number,
    status: LenientInviteEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.summary = summary;
    this.journeyId = journeyId;
    this.amount = amount;
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

  canMoveTo(next: LenientInviteEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: LenientInviteEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient invite estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient invite estimate"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): LenientInviteEstimate {
    return new LenientInviteEstimate(
      this.code,
      this.title,
      this.approved,
      this.summary,
      this.journeyId,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient invite estimate in status idle. */
export function newLenientInviteEstimate(code: string, title: string): LenientInviteEstimate {
  return new LenientInviteEstimate(code, title, false, "", "", 0, "idle");
}
