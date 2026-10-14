/**
 * The exit rule window records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule window is in its life cycle. */
export type ExitRuleWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a exit rule window and its current status. */
export class ExitRuleWindow {
  code: string;
  name: string;
  priority: number;
  windowDays: number;
  budget: number;
  amount: number;
  clicks: number;
  campaignRef: string;
  status: ExitRuleWindowStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    windowDays: number,
    budget: number,
    amount: number,
    clicks: number,
    campaignRef: string,
    status: ExitRuleWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.windowDays = windowDays;
    this.budget = budget;
    this.amount = amount;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule window"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.priority - this.amount) * 100) / 100;
  }

  copy(): ExitRuleWindow {
    return new ExitRuleWindow(
      this.code,
      this.name,
      this.priority,
      this.windowDays,
      this.budget,
      this.amount,
      this.clicks,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a exit rule window in status open. */
export function newExitRuleWindow(code: string, name: string): ExitRuleWindow {
  return new ExitRuleWindow(code, name, 0, 0, 0, 0, 0, "", "open");
}
