import * as text from "../../../../kit/text.js";

/** Where a regional exit rule target is in its life cycle. */
export type RegionalExitRuleTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional exit rule target as the exit rule team keeps it. */
export class RegionalExitRuleTarget {
  code: string;
  label: string;
  conversionRate: number;
  createdAt: number;
  externalRef: string;
  currency: string;
  attributes: Map<string, string>;
  priority: number;
  durationMinutes: number;
  frequencyCap: number;
  status: RegionalExitRuleTargetStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    createdAt: number,
    externalRef: string,
    currency: string,
    attributes: Map<string, string>,
    priority: number,
    durationMinutes: number,
    frequencyCap: number,
    status: RegionalExitRuleTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.currency = currency;
    this.attributes = attributes;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: RegionalExitRuleTargetStatus): boolean {
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
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalExitRuleTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional exit rule target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.priority - this.conversionRate) * 100) / 100;
  }

  copy(): RegionalExitRuleTarget {
    return new RegionalExitRuleTarget(
      this.code,
      this.label,
      this.conversionRate,
      this.createdAt,
      this.externalRef,
      this.currency,
      this.attributes,
      this.priority,
      this.durationMinutes,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional exit rule target in status idle. */
export function newRegionalExitRuleTarget(code: string, label: string): RegionalExitRuleTarget {
  return new RegionalExitRuleTarget(code, label, 0, 0, "", "", new Map<string, string>(), 0, 0, 0, "idle");
}
