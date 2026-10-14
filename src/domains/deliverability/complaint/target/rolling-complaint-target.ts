/**
 * The rolling complaint target records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling complaint target is in its life cycle. */
export type RollingComplaintTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling complaint target and its current status. */
export class RollingComplaintTarget {
  code: string;
  name: string;
  expiresAt: number;
  summary: string;
  archived: boolean;
  currency: string;
  cost: number;
  status: RollingComplaintTargetStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    summary: string,
    archived: boolean,
    currency: string,
    cost: number,
    status: RollingComplaintTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.summary = summary;
    this.archived = archived;
    this.currency = currency;
    this.cost = cost;
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

  canMoveTo(next: RollingComplaintTargetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingComplaintTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling complaint target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round(this.expiresAt * this.cost * 100) / 100;
  }

  copy(): RollingComplaintTarget {
    return new RollingComplaintTarget(
      this.code,
      this.name,
      this.expiresAt,
      this.summary,
      this.archived,
      this.currency,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling complaint target in status open. */
export function newRollingComplaintTarget(code: string, name: string): RollingComplaintTarget {
  return new RollingComplaintTarget(code, name, 0, "", false, "", 0, "open");
}
