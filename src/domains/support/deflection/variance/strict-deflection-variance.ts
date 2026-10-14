/**
 * The strict deflection variance records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict deflection variance is in its life cycle. */
export type StrictDeflectionVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict deflection variance as the deflection team keeps it. */
export class StrictDeflectionVariance {
  code: string;
  label: string;
  category: string;
  quantity: number;
  archived: boolean;
  source: string;
  active: boolean;
  createdAt: number;
  conversionRate: number;
  status: StrictDeflectionVarianceStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    quantity: number,
    archived: boolean,
    source: string,
    active: boolean,
    createdAt: number,
    conversionRate: number,
    status: StrictDeflectionVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.quantity = quantity;
    this.archived = archived;
    this.source = source;
    this.active = active;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: StrictDeflectionVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictDeflectionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict deflection variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.conversionRate - this.quantity) * 100) / 100;
  }

  copy(): StrictDeflectionVariance {
    return new StrictDeflectionVariance(
      this.code,
      this.label,
      this.category,
      this.quantity,
      this.archived,
      this.source,
      this.active,
      this.createdAt,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict deflection variance in status open. */
export function newStrictDeflectionVariance(code: string, label: string): StrictDeflectionVariance {
  return new StrictDeflectionVariance(code, label, "", 0, false, "", false, 0, 0, "open");
}
