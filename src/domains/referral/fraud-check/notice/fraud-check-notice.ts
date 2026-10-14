/**
 * The fraud check notice records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check notice is in its life cycle. */
export type FraudCheckNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fraud check notice, with what the planners need to act on it. */
export class FraudCheckNotice {
  code: string;
  label: string;
  graceDays: number;
  channel: string;
  ratio: number;
  status: FraudCheckNoticeStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    channel: string,
    ratio: number,
    status: FraudCheckNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.channel = channel;
    this.ratio = ratio;
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

  canMoveTo(next: FraudCheckNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.ratio - this.graceDays) * 100) / 100;
  }

  copy(): FraudCheckNotice {
    return new FraudCheckNotice(this.code, this.label, this.graceDays, this.channel, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fraud check notice in status proposed. */
export function newFraudCheckNotice(code: string, label: string): FraudCheckNotice {
  return new FraudCheckNotice(code, label, 0, "", 0, "proposed");
}
