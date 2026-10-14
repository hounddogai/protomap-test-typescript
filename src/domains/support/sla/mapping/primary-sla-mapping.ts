/**
 * The primary sla mapping records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary sla mapping is in its life cycle. */
export type PrimarySlaMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One primary sla mapping, with what the planners need to act on it. */
export class PrimarySlaMapping {
  code: string;
  label: string;
  cohort: string;
  locale: string;
  description: string;
  score: number;
  status: PrimarySlaMappingStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    locale: string,
    description: string,
    score: number,
    status: PrimarySlaMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.locale = locale;
    this.description = description;
    this.score = score;
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

  canMoveTo(next: PrimarySlaMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimarySlaMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sla mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PrimarySlaMapping {
    return new PrimarySlaMapping(
      this.code,
      this.label,
      this.cohort,
      this.locale,
      this.description,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary sla mapping in status draft. */
export function newPrimarySlaMapping(code: string, label: string): PrimarySlaMapping {
  return new PrimarySlaMapping(code, label, "", "", "", 0, "draft");
}
