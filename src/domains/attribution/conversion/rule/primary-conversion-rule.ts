/**
 * The primary conversion rule records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary conversion rule is in its life cycle. */
export type PrimaryConversionRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary conversion rule. Its code is unique within a tenant. */
export class PrimaryConversionRule {
  code: string;
  title: string;
  notes: string;
  variant: string;
  cost: number;
  attempts: number;
  quantity: number;
  budget: number;
  archived: boolean;
  status: PrimaryConversionRuleStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    variant: string,
    cost: number,
    attempts: number,
    quantity: number,
    budget: number,
    archived: boolean,
    status: PrimaryConversionRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.variant = variant;
    this.cost = cost;
    this.attempts = attempts;
    this.quantity = quantity;
    this.budget = budget;
    this.archived = archived;
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

  canMoveTo(next: PrimaryConversionRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
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

  moveTo(next: PrimaryConversionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary conversion rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netValue(): number {
    return Math.round(this.quantity * this.budget * 100) / 100;
  }

  copy(): PrimaryConversionRule {
    return new PrimaryConversionRule(
      this.code,
      this.title,
      this.notes,
      this.variant,
      this.cost,
      this.attempts,
      this.quantity,
      this.budget,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary conversion rule in status idle. */
export function newPrimaryConversionRule(code: string, title: string): PrimaryConversionRule {
  return new PrimaryConversionRule(code, title, "", "", 0, 0, 0, 0, false, "idle");
}
