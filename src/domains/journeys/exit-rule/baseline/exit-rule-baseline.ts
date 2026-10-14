/**
 * The exit rule baseline records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule baseline is in its life cycle. */
export type ExitRuleBaselineStatus = "created" | "validated" | "published" | "retired";

/** One exit rule baseline, with what the planners need to act on it. */
export class ExitRuleBaseline {
  code: string;
  name: string;
  reviewer: string;
  rate: number;
  endsAt: number;
  title: string;
  active: boolean;
  pinned: boolean;
  version: number;
  windowDays: number;
  status: ExitRuleBaselineStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    rate: number,
    endsAt: number,
    title: string,
    active: boolean,
    pinned: boolean,
    version: number,
    windowDays: number,
    status: ExitRuleBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.rate = rate;
    this.endsAt = endsAt;
    this.title = title;
    this.active = active;
    this.pinned = pinned;
    this.version = version;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ExitRuleBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"exit rule baseline"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.endsAt + this.version) * 100) / 100;
  }

  copy(): ExitRuleBaseline {
    return new ExitRuleBaseline(
      this.code,
      this.name,
      this.reviewer,
      this.rate,
      this.endsAt,
      this.title,
      this.active,
      this.pinned,
      this.version,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a exit rule baseline in status created. */
export function newExitRuleBaseline(code: string, name: string): ExitRuleBaseline {
  return new ExitRuleBaseline(code, name, "", 0, 0, "", false, false, 0, 0, "created");
}
