/**
 * The macro baseline records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro baseline is in its life cycle. */
export type MacroBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A macro baseline as the macro team keeps it. */
export class MacroBaseline {
  code: string;
  label: string;
  clicks: number;
  threshold: number;
  tags: string[];
  status: MacroBaselineStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    threshold: number,
    tags: string[],
    status: MacroBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.threshold = threshold;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.clicks - this.threshold) * 100) / 100;
  }

  copy(): MacroBaseline {
    return new MacroBaseline(this.code, this.label, this.clicks, this.threshold, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro baseline in status proposed. */
export function newMacroBaseline(code: string, label: string): MacroBaseline {
  return new MacroBaseline(code, label, 0, 0, [], "proposed");
}
