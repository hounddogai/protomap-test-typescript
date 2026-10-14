/**
 * The cohort template records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort template is in its life cycle. */
export type CohortTemplateStatus = "created" | "validated" | "published" | "retired";

/** One cohort template, with what the planners need to act on it. */
export class CohortTemplate {
  code: string;
  label: string;
  ownerId: string;
  margin: number;
  endsAt: number;
  status: CohortTemplateStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    margin: number,
    endsAt: number,
    status: CohortTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.margin = margin;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.endsAt - this.margin) * 100) / 100;
  }

  copy(): CohortTemplate {
    return new CohortTemplate(this.code, this.label, this.ownerId, this.margin, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a cohort template in status created. */
export function newCohortTemplate(code: string, label: string): CohortTemplate {
  return new CohortTemplate(code, label, "", 0, 0, "created");
}
