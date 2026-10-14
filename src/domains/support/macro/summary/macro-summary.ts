/**
 * The macro summary records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro summary is in its life cycle. */
export type MacroSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A macro summary. Its code is unique within a tenant. */
export class MacroSummary {
  code: string;
  label: string;
  attempts: number;
  channel: string;
  ratio: number;
  approved: boolean;
  floorValue: number;
  batchSize: number;
  cohort: string;
  graceDays: number;
  status: MacroSummaryStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    channel: string,
    ratio: number,
    approved: boolean,
    floorValue: number,
    batchSize: number,
    cohort: string,
    graceDays: number,
    status: MacroSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.channel = channel;
    this.ratio = ratio;
    this.approved = approved;
    this.floorValue = floorValue;
    this.batchSize = batchSize;
    this.cohort = cohort;
    this.graceDays = graceDays;
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

  canMoveTo(next: MacroSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.attempts - this.graceDays) * 100) / 100;
  }

  copy(): MacroSummary {
    return new MacroSummary(
      this.code,
      this.label,
      this.attempts,
      this.channel,
      this.ratio,
      this.approved,
      this.floorValue,
      this.batchSize,
      this.cohort,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a macro summary in status proposed. */
export function newMacroSummary(code: string, label: string): MacroSummary {
  return new MacroSummary(code, label, 0, "", 0, false, 0, 0, "", 0, "proposed");
}
