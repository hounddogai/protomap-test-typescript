/**
 * The regional enrollment mapping records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional enrollment mapping is in its life cycle. */
export type RegionalEnrollmentMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a regional enrollment mapping and its current status. */
export class RegionalEnrollmentMapping {
  code: string;
  label: string;
  discount: number;
  campaignRef: string;
  archived: boolean;
  amount: number;
  threshold: number;
  source: string;
  cohort: string;
  tags: string[];
  weight: number;
  status: RegionalEnrollmentMappingStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    campaignRef: string,
    archived: boolean,
    amount: number,
    threshold: number,
    source: string,
    cohort: string,
    tags: string[],
    weight: number,
    status: RegionalEnrollmentMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.campaignRef = campaignRef;
    this.archived = archived;
    this.amount = amount;
    this.threshold = threshold;
    this.source = source;
    this.cohort = cohort;
    this.tags = tags;
    this.weight = weight;
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

  canMoveTo(next: RegionalEnrollmentMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalEnrollmentMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional enrollment mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional enrollment mapping"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.threshold * this.amount * 100) / 100;
  }

  copy(): RegionalEnrollmentMapping {
    return new RegionalEnrollmentMapping(
      this.code,
      this.label,
      this.discount,
      this.campaignRef,
      this.archived,
      this.amount,
      this.threshold,
      this.source,
      this.cohort,
      this.tags,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional enrollment mapping in status planned. */
export function newRegionalEnrollmentMapping(code: string, label: string): RegionalEnrollmentMapping {
  return new RegionalEnrollmentMapping(code, label, 0, "", false, 0, 0, "", "", [], 0, "planned");
}
