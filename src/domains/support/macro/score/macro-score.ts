/**
 * The macro score records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro score is in its life cycle. */
export type MacroScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A macro score as the macro team keeps it. */
export class MacroScore {
  code: string;
  label: string;
  archived: boolean;
  limit: number;
  timezone: string;
  notes: string;
  status: MacroScoreStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    limit: number,
    timezone: string,
    notes: string,
    status: MacroScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.limit = limit;
    this.timezone = timezone;
    this.notes = notes;
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

  canMoveTo(next: MacroScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "stopped";
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

  moveTo(next: MacroScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"macro score"} ${this.code}`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): MacroScore {
    return new MacroScore(this.code, this.label, this.archived, this.limit, this.timezone, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro score in status idle. */
export function newMacroScore(code: string, label: string): MacroScore {
  return new MacroScore(code, label, false, 0, "", "", "idle");
}
