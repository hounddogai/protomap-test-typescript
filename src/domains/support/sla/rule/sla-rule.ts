/**
 * The sla rule records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla rule is in its life cycle. */
export type SlaRuleStatus = "created" | "validated" | "published" | "retired";

/** The record of a sla rule and its current status. */
export class SlaRule {
  code: string;
  label: string;
  tags: string[];
  clicks: number;
  cost: number;
  status: SlaRuleStatus;

  constructor(code: string, label: string, tags: string[], clicks: number, cost: number, status: SlaRuleStatus) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.clicks = clicks;
    this.cost = cost;
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

  canMoveTo(next: SlaRuleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SlaRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"sla rule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round(this.cost * this.clicks * 100) / 100;
  }

  copy(): SlaRule {
    return new SlaRule(this.code, this.label, this.tags, this.clicks, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sla rule in status created. */
export function newSlaRule(code: string, label: string): SlaRule {
  return new SlaRule(code, label, [], 0, 0, "created");
}
