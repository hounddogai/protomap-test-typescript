/**
 * The fraud check group records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check group is in its life cycle. */
export type FraudCheckGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fraud check group, with what the planners need to act on it. */
export class FraudCheckGroup {
  code: string;
  title: string;
  threshold: number;
  score: number;
  locale: string;
  campaignRef: string;
  channel: string;
  status: FraudCheckGroupStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    score: number,
    locale: string,
    campaignRef: string,
    channel: string,
    status: FraudCheckGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.score = score;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.channel = channel;
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

  canMoveTo(next: FraudCheckGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.score + this.threshold) * 100) / 100;
  }

  copy(): FraudCheckGroup {
    return new FraudCheckGroup(
      this.code,
      this.title,
      this.threshold,
      this.score,
      this.locale,
      this.campaignRef,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fraud check group in status proposed. */
export function newFraudCheckGroup(code: string, title: string): FraudCheckGroup {
  return new FraudCheckGroup(code, title, 0, 0, "", "", "", "proposed");
}
