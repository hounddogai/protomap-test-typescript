/**
 * The pending cohort template records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending cohort template is in its life cycle. */
export type PendingCohortTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending cohort template and its current status. */
export class PendingCohortTemplate {
  code: string;
  name: string;
  timezone: string;
  country: string;
  batchSize: number;
  quantity: number;
  expiresAt: number;
  label: string;
  capacity: number;
  status: PendingCohortTemplateStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    country: string,
    batchSize: number,
    quantity: number,
    expiresAt: number,
    label: string,
    capacity: number,
    status: PendingCohortTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.country = country;
    this.batchSize = batchSize;
    this.quantity = quantity;
    this.expiresAt = expiresAt;
    this.label = label;
    this.capacity = capacity;
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

  canMoveTo(next: PendingCohortTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingCohortTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending cohort template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.quantity - this.capacity) * 100) / 100;
  }

  copy(): PendingCohortTemplate {
    return new PendingCohortTemplate(
      this.code,
      this.name,
      this.timezone,
      this.country,
      this.batchSize,
      this.quantity,
      this.expiresAt,
      this.label,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending cohort template in status open. */
export function newPendingCohortTemplate(code: string, name: string): PendingCohortTemplate {
  return new PendingCohortTemplate(code, name, "", "", 0, 0, 0, "", 0, "open");
}
