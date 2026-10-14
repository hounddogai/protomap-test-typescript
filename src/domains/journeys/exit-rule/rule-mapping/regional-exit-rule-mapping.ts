/**
 * The regional exit rule mapping records of journeys's exit rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional exit rule mapping is in its life cycle. */
export type RegionalExitRuleMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a regional exit rule mapping and its current status. */
export class RegionalExitRuleMapping {
  code: string;
  label: string;
  attempts: number;
  reviewer: string;
  frequencyCap: number;
  status: RegionalExitRuleMappingStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    reviewer: string,
    frequencyCap: number,
    status: RegionalExitRuleMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: RegionalExitRuleMappingStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalExitRuleMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional exit rule mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional exit rule mapping"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.frequencyCap + this.attempts) * 100) / 100;
  }

  copy(): RegionalExitRuleMapping {
    return new RegionalExitRuleMapping(
      this.code,
      this.label,
      this.attempts,
      this.reviewer,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional exit rule mapping in status new. */
export function newRegionalExitRuleMapping(code: string, label: string): RegionalExitRuleMapping {
  return new RegionalExitRuleMapping(code, label, 0, "", 0, "new");
}
