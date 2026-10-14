/**
 * The lenient exit rule adjustment records of journeys's exit rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient exit rule adjustment is in its life cycle. */
export type LenientExitRuleAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient exit rule adjustment. Its code is unique within a tenant. */
export class LenientExitRuleAdjustment {
  code: string;
  title: string;
  startsAt: number;
  externalRef: string;
  cost: number;
  phone: string;
  journeyId: string;
  status: LenientExitRuleAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    externalRef: string,
    cost: number,
    phone: string,
    journeyId: string,
    status: LenientExitRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.cost = cost;
    this.phone = phone;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientExitRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientExitRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient exit rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient exit rule adjustment"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.cost + this.startsAt) * 100) / 100;
  }

  copy(): LenientExitRuleAdjustment {
    return new LenientExitRuleAdjustment(
      this.code,
      this.title,
      this.startsAt,
      this.externalRef,
      this.cost,
      this.phone,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient exit rule adjustment in status new. */
export function newLenientExitRuleAdjustment(code: string, title: string): LenientExitRuleAdjustment {
  return new LenientExitRuleAdjustment(code, title, 0, "", 0, "", "", "new");
}
