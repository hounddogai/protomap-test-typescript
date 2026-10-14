/**
 * The global reward baseline records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global reward baseline is in its life cycle. */
export type GlobalRewardBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global reward baseline as the reward team keeps it. */
export class GlobalRewardBaseline {
  code: string;
  title: string;
  checksum: string;
  source: string;
  name: string;
  amount: number;
  status: GlobalRewardBaselineStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    source: string,
    name: string,
    amount: number,
    status: GlobalRewardBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.source = source;
    this.name = name;
    this.amount = amount;
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

  canMoveTo(next: GlobalRewardBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalRewardBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): GlobalRewardBaseline {
    return new GlobalRewardBaseline(
      this.code,
      this.title,
      this.checksum,
      this.source,
      this.name,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global reward baseline in status new. */
export function newGlobalRewardBaseline(code: string, title: string): GlobalRewardBaseline {
  return new GlobalRewardBaseline(code, title, "", "", "", 0, "new");
}
