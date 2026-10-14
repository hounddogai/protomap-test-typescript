/**
 * The primary branch record records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary branch record is in its life cycle. */
export type PrimaryBranchRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a primary branch record and its current status. */
export class PrimaryBranchRecord {
  code: string;
  label: string;
  maximum: number;
  locale: string;
  region: string;
  budget: number;
  status: PrimaryBranchRecordStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    locale: string,
    region: string,
    budget: number,
    status: PrimaryBranchRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.locale = locale;
    this.region = region;
    this.budget = budget;
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

  canMoveTo(next: PrimaryBranchRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PrimaryBranchRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary branch record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.maximum * this.budget * 100) / 100;
  }

  copy(): PrimaryBranchRecord {
    return new PrimaryBranchRecord(
      this.code,
      this.label,
      this.maximum,
      this.locale,
      this.region,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary branch record in status open. */
export function newPrimaryBranchRecord(code: string, label: string): PrimaryBranchRecord {
  return new PrimaryBranchRecord(code, label, 0, "", "", 0, "open");
}
