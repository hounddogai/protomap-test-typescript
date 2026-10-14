/**
 * The exit rule audit records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule audit is in its life cycle. */
export type ExitRuleAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One exit rule audit, with what the planners need to act on it. */
export class ExitRuleAudit {
  code: string;
  name: string;
  score: number;
  priority: number;
  graceDays: number;
  country: string;
  status: ExitRuleAuditStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    priority: number,
    graceDays: number,
    country: string,
    status: ExitRuleAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.priority = priority;
    this.graceDays = graceDays;
    this.country = country;
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

  canMoveTo(next: ExitRuleAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ExitRuleAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.score + this.priority) * 100) / 100;
  }

  copy(): ExitRuleAudit {
    return new ExitRuleAudit(
      this.code,
      this.name,
      this.score,
      this.priority,
      this.graceDays,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a exit rule audit in status idle. */
export function newExitRuleAudit(code: string, name: string): ExitRuleAudit {
  return new ExitRuleAudit(code, name, 0, 0, 0, "", "idle");
}
