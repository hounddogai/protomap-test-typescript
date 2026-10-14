/**
 * The pacing plan records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing plan is in its life cycle. */
export type PacingPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pacing plan as the pacing team keeps it. */
export class PacingPlan {
  code: string;
  label: string;
  timezone: string;
  attributes: Map<string, string>;
  graceDays: number;
  discount: number;
  rate: number;
  phone: string;
  clicks: number;
  score: number;
  variant: string;
  status: PacingPlanStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    attributes: Map<string, string>,
    graceDays: number,
    discount: number,
    rate: number,
    phone: string,
    clicks: number,
    score: number,
    variant: string,
    status: PacingPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.attributes = attributes;
    this.graceDays = graceDays;
    this.discount = discount;
    this.rate = rate;
    this.phone = phone;
    this.clicks = clicks;
    this.score = score;
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

  canMoveTo(next: PacingPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.rate - this.discount) * 100) / 100;
  }

  copy(): PacingPlan {
    return new PacingPlan(
      this.code,
      this.label,
      this.timezone,
      this.attributes,
      this.graceDays,
      this.discount,
      this.rate,
      this.phone,
      this.clicks,
      this.score,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pacing plan in status open. */
export function newPacingPlan(code: string, label: string): PacingPlan {
  return new PacingPlan(code, label, "", new Map<string, string>(), 0, 0, 0, "", 0, 0, "", "open");
}
