/**
 * The conversion group records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion group is in its life cycle. */
export type ConversionGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a conversion group and its current status. */
export class ConversionGroup {
  code: string;
  label: string;
  visible: boolean;
  budget: number;
  locale: string;
  createdAt: number;
  cohort: string;
  attempts: number;
  status: ConversionGroupStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    budget: number,
    locale: string,
    createdAt: number,
    cohort: string,
    attempts: number,
    status: ConversionGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.budget = budget;
    this.locale = locale;
    this.createdAt = createdAt;
    this.cohort = cohort;
    this.attempts = attempts;
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

  canMoveTo(next: ConversionGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"conversion group"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.budget * this.attempts * 100) / 100;
  }

  copy(): ConversionGroup {
    return new ConversionGroup(
      this.code,
      this.label,
      this.visible,
      this.budget,
      this.locale,
      this.createdAt,
      this.cohort,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a conversion group in status draft. */
export function newConversionGroup(code: string, label: string): ConversionGroup {
  return new ConversionGroup(code, label, false, 0, "", 0, "", 0, "draft");
}
