/**
 * The escalation plan records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation plan is in its life cycle. */
export type EscalationPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One escalation plan, with what the planners need to act on it. */
export class EscalationPlan {
  code: string;
  label: string;
  amount: number;
  quantity: number;
  windowDays: number;
  score: number;
  capacity: number;
  status: EscalationPlanStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    quantity: number,
    windowDays: number,
    score: number,
    capacity: number,
    status: EscalationPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.quantity = quantity;
    this.windowDays = windowDays;
    this.score = score;
    this.capacity = capacity;
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

  canMoveTo(next: EscalationPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
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

  moveTo(next: EscalationPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.amount + this.score) * 100) / 100;
  }

  copy(): EscalationPlan {
    return new EscalationPlan(
      this.code,
      this.label,
      this.amount,
      this.quantity,
      this.windowDays,
      this.score,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a escalation plan in status idle. */
export function newEscalationPlan(code: string, label: string): EscalationPlan {
  return new EscalationPlan(code, label, 0, 0, 0, 0, 0, "idle");
}
