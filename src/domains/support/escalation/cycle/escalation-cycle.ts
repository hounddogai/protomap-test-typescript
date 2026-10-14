/**
 * The escalation cycle records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation cycle is in its life cycle. */
export type EscalationCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a escalation cycle and its current status. */
export class EscalationCycle {
  code: string;
  label: string;
  locale: string;
  openRate: number;
  floorValue: number;
  margin: number;
  summary: string;
  limit: number;
  sendAt: number;
  status: EscalationCycleStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    openRate: number,
    floorValue: number,
    margin: number,
    summary: string,
    limit: number,
    sendAt: number,
    status: EscalationCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.openRate = openRate;
    this.floorValue = floorValue;
    this.margin = margin;
    this.summary = summary;
    this.limit = limit;
    this.sendAt = sendAt;
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

  canMoveTo(next: EscalationCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
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

  moveTo(next: EscalationCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round(this.limit * this.floorValue * 100) / 100;
  }

  copy(): EscalationCycle {
    return new EscalationCycle(
      this.code,
      this.label,
      this.locale,
      this.openRate,
      this.floorValue,
      this.margin,
      this.summary,
      this.limit,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a escalation cycle in status new. */
export function newEscalationCycle(code: string, label: string): EscalationCycle {
  return new EscalationCycle(code, label, "", 0, 0, 0, "", 0, 0, "new");
}
