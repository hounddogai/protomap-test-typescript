/**
 * The regional escalation variance records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional escalation variance is in its life cycle. */
export type RegionalEscalationVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional escalation variance as the escalation team keeps it. */
export class RegionalEscalationVariance {
  code: string;
  name: string;
  category: string;
  journeyId: string;
  quantity: number;
  threshold: number;
  updatedAt: number;
  createdAt: number;
  title: string;
  archived: boolean;
  active: boolean;
  status: RegionalEscalationVarianceStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    journeyId: string,
    quantity: number,
    threshold: number,
    updatedAt: number,
    createdAt: number,
    title: string,
    archived: boolean,
    active: boolean,
    status: RegionalEscalationVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
    this.title = title;
    this.archived = archived;
    this.active = active;
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

  canMoveTo(next: RegionalEscalationVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalEscalationVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional escalation variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional escalation variance"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.createdAt + this.threshold) * 100) / 100;
  }

  copy(): RegionalEscalationVariance {
    return new RegionalEscalationVariance(
      this.code,
      this.name,
      this.category,
      this.journeyId,
      this.quantity,
      this.threshold,
      this.updatedAt,
      this.createdAt,
      this.title,
      this.archived,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional escalation variance in status open. */
export function newRegionalEscalationVariance(code: string, name: string): RegionalEscalationVariance {
  return new RegionalEscalationVariance(code, name, "", "", 0, 0, 0, 0, "", false, false, "open");
}
