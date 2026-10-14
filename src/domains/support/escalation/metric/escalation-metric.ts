/**
 * The escalation metric records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation metric is in its life cycle. */
export type EscalationMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a escalation metric and its current status. */
export class EscalationMetric {
  code: string;
  label: string;
  cohort: string;
  contactEmail: string;
  graceDays: number;
  reviewer: string;
  ceiling: number;
  floorValue: number;
  status: EscalationMetricStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    contactEmail: string,
    graceDays: number,
    reviewer: string,
    ceiling: number,
    floorValue: number,
    status: EscalationMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.ceiling = ceiling;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: EscalationMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"escalation metric"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.ceiling * this.graceDays * 100) / 100;
  }

  copy(): EscalationMetric {
    return new EscalationMetric(
      this.code,
      this.label,
      this.cohort,
      this.contactEmail,
      this.graceDays,
      this.reviewer,
      this.ceiling,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a escalation metric in status draft. */
export function newEscalationMetric(code: string, label: string): EscalationMetric {
  return new EscalationMetric(code, label, "", "", 0, "", 0, 0, "draft");
}
