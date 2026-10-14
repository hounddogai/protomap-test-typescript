/**
 * The adaptive deflection template records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive deflection template is in its life cycle. */
export type AdaptiveDeflectionTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a adaptive deflection template and its current status. */
export class AdaptiveDeflectionTemplate {
  code: string;
  title: string;
  frequencyCap: number;
  floorValue: number;
  createdAt: number;
  priority: number;
  quantity: number;
  amount: number;
  status: AdaptiveDeflectionTemplateStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    floorValue: number,
    createdAt: number,
    priority: number,
    quantity: number,
    amount: number,
    status: AdaptiveDeflectionTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.createdAt = createdAt;
    this.priority = priority;
    this.quantity = quantity;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveDeflectionTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveDeflectionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive deflection template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive deflection template"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.frequencyCap * this.floorValue * 100) / 100;
  }

  copy(): AdaptiveDeflectionTemplate {
    return new AdaptiveDeflectionTemplate(
      this.code,
      this.title,
      this.frequencyCap,
      this.floorValue,
      this.createdAt,
      this.priority,
      this.quantity,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive deflection template in status planned. */
export function newAdaptiveDeflectionTemplate(code: string, title: string): AdaptiveDeflectionTemplate {
  return new AdaptiveDeflectionTemplate(code, title, 0, 0, 0, 0, 0, 0, "planned");
}
