/**
 * The ticket view rollup records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view rollup is in its life cycle. */
export type TicketViewRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One ticket view rollup, with what the planners need to act on it. */
export class TicketViewRollup {
  code: string;
  label: string;
  attributes: Map<string, string>;
  ceiling: number;
  summary: string;
  active: boolean;
  rate: number;
  frequencyCap: number;
  status: TicketViewRollupStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    ceiling: number,
    summary: string,
    active: boolean,
    rate: number,
    frequencyCap: number,
    status: TicketViewRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.ceiling = ceiling;
    this.summary = summary;
    this.active = active;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: TicketViewRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TicketViewRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.ceiling + this.rate) * 100) / 100;
  }

  copy(): TicketViewRollup {
    return new TicketViewRollup(
      this.code,
      this.label,
      this.attributes,
      this.ceiling,
      this.summary,
      this.active,
      this.rate,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a ticket view rollup in status planned. */
export function newTicketViewRollup(code: string, label: string): TicketViewRollup {
  return new TicketViewRollup(code, label, new Map<string, string>(), 0, "", false, 0, 0, "planned");
}
