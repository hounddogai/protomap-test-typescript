/**
 * The manual level plan records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual level plan is in its life cycle. */
export type ManualLevelPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual level plan and its current status. */
export class ManualLevelPlan {
  code: string;
  label: string;
  unit: string;
  attempts: number;
  notes: string;
  priority: number;
  openRate: number;
  category: string;
  region: string;
  status: ManualLevelPlanStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    attempts: number,
    notes: string,
    priority: number,
    openRate: number,
    category: string,
    region: string,
    status: ManualLevelPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.attempts = attempts;
    this.notes = notes;
    this.priority = priority;
    this.openRate = openRate;
    this.category = category;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualLevelPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualLevelPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual level plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.openRate * this.priority * 100) / 100;
  }

  copy(): ManualLevelPlan {
    return new ManualLevelPlan(
      this.code,
      this.label,
      this.unit,
      this.attempts,
      this.notes,
      this.priority,
      this.openRate,
      this.category,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a manual level plan in status requested. */
export function newManualLevelPlan(code: string, label: string): ManualLevelPlan {
  return new ManualLevelPlan(code, label, "", 0, "", 0, 0, "", "", "requested");
}
