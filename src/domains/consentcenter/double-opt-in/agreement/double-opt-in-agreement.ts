/**
 * The double opt in agreement records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in agreement is in its life cycle. */
export type DoubleOptInAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One double opt in agreement, with what the planners need to act on it. */
export class DoubleOptInAgreement {
  code: string;
  label: string;
  limit: number;
  score: number;
  durationMinutes: number;
  ceiling: number;
  bid: number;
  pinned: boolean;
  active: boolean;
  name: string;
  status: DoubleOptInAgreementStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    score: number,
    durationMinutes: number,
    ceiling: number,
    bid: number,
    pinned: boolean,
    active: boolean,
    name: string,
    status: DoubleOptInAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.score = score;
    this.durationMinutes = durationMinutes;
    this.ceiling = ceiling;
    this.bid = bid;
    this.pinned = pinned;
    this.active = active;
    this.name = name;
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

  canMoveTo(next: DoubleOptInAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DoubleOptInAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"double opt in agreement"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.bid + this.limit) * 100) / 100;
  }

  copy(): DoubleOptInAgreement {
    return new DoubleOptInAgreement(
      this.code,
      this.label,
      this.limit,
      this.score,
      this.durationMinutes,
      this.ceiling,
      this.bid,
      this.pinned,
      this.active,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a double opt in agreement in status idle. */
export function newDoubleOptInAgreement(code: string, label: string): DoubleOptInAgreement {
  return new DoubleOptInAgreement(code, label, 0, 0, 0, 0, 0, false, false, "", "idle");
}
