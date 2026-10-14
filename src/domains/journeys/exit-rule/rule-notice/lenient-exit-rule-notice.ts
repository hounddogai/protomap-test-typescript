/**
 * The lenient exit rule notice records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient exit rule notice is in its life cycle. */
export type LenientExitRuleNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient exit rule notice and its current status. */
export class LenientExitRuleNotice {
  code: string;
  title: string;
  notes: string;
  windowDays: number;
  ownerId: string;
  status: LenientExitRuleNoticeStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    windowDays: number,
    ownerId: string,
    status: LenientExitRuleNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
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

  canMoveTo(next: LenientExitRuleNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
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
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientExitRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient exit rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): LenientExitRuleNotice {
    return new LenientExitRuleNotice(this.code, this.title, this.notes, this.windowDays, this.ownerId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient exit rule notice in status idle. */
export function newLenientExitRuleNotice(code: string, title: string): LenientExitRuleNotice {
  return new LenientExitRuleNotice(code, title, "", 0, "", "idle");
}
