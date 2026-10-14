/**
 * The capped branch plan records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped branch plan is in its life cycle. */
export type CappedBranchPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a capped branch plan and its current status. */
export class CappedBranchPlan {
  code: string;
  name: string;
  windowDays: number;
  utmSource: string;
  summary: string;
  createdAt: number;
  budget: number;
  visible: boolean;
  floorValue: number;
  locale: string;
  status: CappedBranchPlanStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    utmSource: string,
    summary: string,
    createdAt: number,
    budget: number,
    visible: boolean,
    floorValue: number,
    locale: string,
    status: CappedBranchPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.utmSource = utmSource;
    this.summary = summary;
    this.createdAt = createdAt;
    this.budget = budget;
    this.visible = visible;
    this.floorValue = floorValue;
    this.locale = locale;
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

  canMoveTo(next: CappedBranchPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedBranchPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped branch plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round(this.budget * this.createdAt * 100) / 100;
  }

  copy(): CappedBranchPlan {
    return new CappedBranchPlan(
      this.code,
      this.name,
      this.windowDays,
      this.utmSource,
      this.summary,
      this.createdAt,
      this.budget,
      this.visible,
      this.floorValue,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped branch plan in status planned. */
export function newCappedBranchPlan(code: string, name: string): CappedBranchPlan {
  return new CappedBranchPlan(code, name, 0, "", "", 0, 0, false, 0, "", "planned");
}
