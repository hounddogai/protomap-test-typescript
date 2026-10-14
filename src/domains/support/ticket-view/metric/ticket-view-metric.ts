/**
 * The ticket view metric records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view metric is in its life cycle. */
export type TicketViewMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One ticket view metric, with what the planners need to act on it. */
export class TicketViewMetric {
  code: string;
  title: string;
  notes: string;
  active: boolean;
  revision: number;
  sendAt: number;
  status: TicketViewMetricStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    active: boolean,
    revision: number,
    sendAt: number,
    status: TicketViewMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.active = active;
    this.revision = revision;
    this.sendAt = sendAt;
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

  canMoveTo(next: TicketViewMetricStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TicketViewMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round(this.revision * this.sendAt * 100) / 100;
  }

  copy(): TicketViewMetric {
    return new TicketViewMetric(
      this.code,
      this.title,
      this.notes,
      this.active,
      this.revision,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a ticket view metric in status open. */
export function newTicketViewMetric(code: string, title: string): TicketViewMetric {
  return new TicketViewMetric(code, title, "", false, 0, 0, "open");
}
