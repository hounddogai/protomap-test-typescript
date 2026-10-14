/**
 * The scheduled flight rule records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled flight rule is in its life cycle. */
export type ScheduledFlightRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled flight rule. Its code is unique within a tenant. */
export class ScheduledFlightRule {
  code: string;
  label: string;
  priority: number;
  variant: string;
  minimum: number;
  approved: boolean;
  createdAt: number;
  sendAt: number;
  status: ScheduledFlightRuleStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    variant: string,
    minimum: number,
    approved: boolean,
    createdAt: number,
    sendAt: number,
    status: ScheduledFlightRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.variant = variant;
    this.minimum = minimum;
    this.approved = approved;
    this.createdAt = createdAt;
    this.sendAt = sendAt;
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

  canMoveTo(next: ScheduledFlightRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFlightRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled flight rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.createdAt + this.priority) * 100) / 100;
  }

  copy(): ScheduledFlightRule {
    return new ScheduledFlightRule(
      this.code,
      this.label,
      this.priority,
      this.variant,
      this.minimum,
      this.approved,
      this.createdAt,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled flight rule in status idle. */
export function newScheduledFlightRule(code: string, label: string): ScheduledFlightRule {
  return new ScheduledFlightRule(code, label, 0, "", 0, false, 0, 0, "idle");
}
