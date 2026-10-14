/**
 * The capped fraud check exception records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped fraud check exception is in its life cycle. */
export type CappedFraudCheckExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped fraud check exception, with what the planners need to act on it. */
export class CappedFraudCheckException {
  code: string;
  title: string;
  region: string;
  sendAt: number;
  utmSource: string;
  score: number;
  status: CappedFraudCheckExceptionStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    sendAt: number,
    utmSource: string,
    score: number,
    status: CappedFraudCheckExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.score = score;
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

  canMoveTo(next: CappedFraudCheckExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedFraudCheckExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped fraud check exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.score * this.sendAt * 100) / 100;
  }

  copy(): CappedFraudCheckException {
    return new CappedFraudCheckException(
      this.code,
      this.title,
      this.region,
      this.sendAt,
      this.utmSource,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped fraud check exception in status proposed. */
export function newCappedFraudCheckException(code: string, title: string): CappedFraudCheckException {
  return new CappedFraudCheckException(code, title, "", 0, "", 0, "proposed");
}
