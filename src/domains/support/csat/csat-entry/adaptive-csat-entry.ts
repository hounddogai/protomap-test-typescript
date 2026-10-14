/**
 * The adaptive csat entry records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive csat entry is in its life cycle. */
export type AdaptiveCsatEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive csat entry and its current status. */
export class AdaptiveCsatEntry {
  code: string;
  name: string;
  contactEmail: string;
  reviewer: string;
  conversionRate: number;
  externalRef: string;
  budget: number;
  unit: string;
  country: string;
  summary: string;
  status: AdaptiveCsatEntryStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    reviewer: string,
    conversionRate: number,
    externalRef: string,
    budget: number,
    unit: string,
    country: string,
    summary: string,
    status: AdaptiveCsatEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
    this.budget = budget;
    this.unit = unit;
    this.country = country;
    this.summary = summary;
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

  canMoveTo(next: AdaptiveCsatEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: AdaptiveCsatEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive csat entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.conversionRate - this.budget) * 100) / 100;
  }

  copy(): AdaptiveCsatEntry {
    return new AdaptiveCsatEntry(
      this.code,
      this.name,
      this.contactEmail,
      this.reviewer,
      this.conversionRate,
      this.externalRef,
      this.budget,
      this.unit,
      this.country,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive csat entry in status draft. */
export function newAdaptiveCsatEntry(code: string, name: string): AdaptiveCsatEntry {
  return new AdaptiveCsatEntry(code, name, "", "", 0, "", 0, "", "", "", "draft");
}
