/**
 * The macro metric records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro metric is in its life cycle. */
export type MacroMetricStatus = "created" | "validated" | "published" | "retired";

/** A macro metric as the macro team keeps it. */
export class MacroMetric {
  code: string;
  name: string;
  frequencyCap: number;
  approved: boolean;
  label: string;
  region: string;
  reviewer: string;
  status: MacroMetricStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    approved: boolean,
    label: string,
    region: string,
    reviewer: string,
    status: MacroMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.approved = approved;
    this.label = label;
    this.region = region;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"macro metric"} ${this.code}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): MacroMetric {
    return new MacroMetric(
      this.code,
      this.name,
      this.frequencyCap,
      this.approved,
      this.label,
      this.region,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a macro metric in status created. */
export function newMacroMetric(code: string, name: string): MacroMetric {
  return new MacroMetric(code, name, 0, false, "", "", "", "created");
}
