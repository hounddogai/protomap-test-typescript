import * as text from "../../../../kit/text.js";

/** Where a preference rule is in its life cycle. */
export type PreferenceRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a preference rule and its current status. */
export class PreferenceRule {
  code: string;
  label: string;
  floorValue: number;
  quantity: number;
  unit: string;
  threshold: number;
  status: PreferenceRuleStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    quantity: number,
    unit: string,
    threshold: number,
    status: PreferenceRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.quantity = quantity;
    this.unit = unit;
    this.threshold = threshold;
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

  canMoveTo(next: PreferenceRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PreferenceRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.quantity - this.floorValue) * 100) / 100;
  }

  copy(): PreferenceRule {
    return new PreferenceRule(
      this.code,
      this.label,
      this.floorValue,
      this.quantity,
      this.unit,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a preference rule in status idle. */
export function newPreferenceRule(code: string, label: string): PreferenceRule {
  return new PreferenceRule(code, label, 0, 0, "", 0, "idle");
}
