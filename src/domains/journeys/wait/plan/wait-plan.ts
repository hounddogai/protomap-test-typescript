/**
 * The wait plan records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait plan is in its life cycle. */
export type WaitPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A wait plan. Its code is unique within a tenant. */
export class WaitPlan {
  code: string;
  title: string;
  floorValue: number;
  approved: boolean;
  margin: number;
  discount: number;
  contactEmail: string;
  status: WaitPlanStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    approved: boolean,
    margin: number,
    discount: number,
    contactEmail: string,
    status: WaitPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.approved = approved;
    this.margin = margin;
    this.discount = discount;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: WaitPlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WaitPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.margin + this.floorValue) * 100) / 100;
  }

  copy(): WaitPlan {
    return new WaitPlan(
      this.code,
      this.title,
      this.floorValue,
      this.approved,
      this.margin,
      this.discount,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait plan in status open. */
export function newWaitPlan(code: string, title: string): WaitPlan {
  return new WaitPlan(code, title, 0, false, 0, 0, "", "open");
}
