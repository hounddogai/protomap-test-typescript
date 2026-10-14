/**
 * The escalation budget records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation budget is in its life cycle. */
export type EscalationBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One escalation budget, with what the planners need to act on it. */
export class EscalationBudget {
  code: string;
  title: string;
  durationMinutes: number;
  impressions: number;
  tags: string[];
  status: EscalationBudgetStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    impressions: number,
    tags: string[],
    status: EscalationBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: EscalationBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"escalation budget"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.durationMinutes * this.impressions * 100) / 100;
  }

  copy(): EscalationBudget {
    return new EscalationBudget(this.code, this.title, this.durationMinutes, this.impressions, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a escalation budget in status planned. */
export function newEscalationBudget(code: string, title: string): EscalationBudget {
  return new EscalationBudget(code, title, 0, 0, [], "planned");
}
