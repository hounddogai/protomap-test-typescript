/**
 * The sla override records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla override is in its life cycle. */
export type SlaOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A sla override as the sla team keeps it. */
export class SlaOverride {
  code: string;
  name: string;
  ceiling: number;
  label: string;
  title: string;
  pinned: boolean;
  budget: number;
  variant: string;
  status: SlaOverrideStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    label: string,
    title: string,
    pinned: boolean,
    budget: number,
    variant: string,
    status: SlaOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.label = label;
    this.title = title;
    this.pinned = pinned;
    this.budget = budget;
    this.variant = variant;
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

  canMoveTo(next: SlaOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SlaOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.ceiling + this.budget) * 100) / 100;
  }

  copy(): SlaOverride {
    return new SlaOverride(
      this.code,
      this.name,
      this.ceiling,
      this.label,
      this.title,
      this.pinned,
      this.budget,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sla override in status open. */
export function newSlaOverride(code: string, name: string): SlaOverride {
  return new SlaOverride(code, name, 0, "", "", false, 0, "", "open");
}
