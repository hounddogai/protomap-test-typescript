/**
 * The tiered journey threshold records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered journey threshold is in its life cycle. */
export type TieredJourneyThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered journey threshold. Its code is unique within a tenant. */
export class TieredJourneyThreshold {
  code: string;
  label: string;
  discount: number;
  variant: string;
  frequencyCap: number;
  summary: string;
  notes: string;
  contactEmail: string;
  threshold: number;
  description: string;
  status: TieredJourneyThresholdStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    variant: string,
    frequencyCap: number,
    summary: string,
    notes: string,
    contactEmail: string,
    threshold: number,
    description: string,
    status: TieredJourneyThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.variant = variant;
    this.frequencyCap = frequencyCap;
    this.summary = summary;
    this.notes = notes;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredJourneyThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredJourneyThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered journey threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.frequencyCap + this.threshold) * 100) / 100;
  }

  copy(): TieredJourneyThreshold {
    return new TieredJourneyThreshold(
      this.code,
      this.label,
      this.discount,
      this.variant,
      this.frequencyCap,
      this.summary,
      this.notes,
      this.contactEmail,
      this.threshold,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered journey threshold in status planned. */
export function newTieredJourneyThreshold(code: string, label: string): TieredJourneyThreshold {
  return new TieredJourneyThreshold(code, label, 0, "", 0, "", "", "", 0, "", "planned");
}
