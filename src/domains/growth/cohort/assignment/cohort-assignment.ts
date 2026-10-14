/**
 * The cohort assignment records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort assignment is in its life cycle. */
export type CohortAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a cohort assignment and its current status. */
export class CohortAssignment {
  code: string;
  name: string;
  summary: string;
  campaignRef: string;
  journeyId: string;
  ceiling: number;
  country: string;
  budget: number;
  retries: number;
  createdAt: number;
  status: CohortAssignmentStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    campaignRef: string,
    journeyId: string,
    ceiling: number,
    country: string,
    budget: number,
    retries: number,
    createdAt: number,
    status: CohortAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.country = country;
    this.budget = budget;
    this.retries = retries;
    this.createdAt = createdAt;
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

  canMoveTo(next: CohortAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
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

  moveTo(next: CohortAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.retries + this.budget) * 100) / 100;
  }

  copy(): CohortAssignment {
    return new CohortAssignment(
      this.code,
      this.name,
      this.summary,
      this.campaignRef,
      this.journeyId,
      this.ceiling,
      this.country,
      this.budget,
      this.retries,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a cohort assignment in status open. */
export function newCohortAssignment(code: string, name: string): CohortAssignment {
  return new CohortAssignment(code, name, "", "", "", 0, "", 0, 0, 0, "open");
}
