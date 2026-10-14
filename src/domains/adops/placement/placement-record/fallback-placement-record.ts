/**
 * The fallback placement record records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback placement record is in its life cycle. */
export type FallbackPlacementRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback placement record, with what the planners need to act on it. */
export class FallbackPlacementRecord {
  code: string;
  title: string;
  notes: string;
  minimum: number;
  impressions: number;
  archived: boolean;
  contactEmail: string;
  checksum: string;
  status: FallbackPlacementRecordStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    minimum: number,
    impressions: number,
    archived: boolean,
    contactEmail: string,
    checksum: string,
    status: FallbackPlacementRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.minimum = minimum;
    this.impressions = impressions;
    this.archived = archived;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
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

  canMoveTo(next: FallbackPlacementRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
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

  moveTo(next: FallbackPlacementRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback placement record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.impressions - this.minimum) * 100) / 100;
  }

  copy(): FallbackPlacementRecord {
    return new FallbackPlacementRecord(
      this.code,
      this.title,
      this.notes,
      this.minimum,
      this.impressions,
      this.archived,
      this.contactEmail,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback placement record in status open. */
export function newFallbackPlacementRecord(code: string, title: string): FallbackPlacementRecord {
  return new FallbackPlacementRecord(code, title, "", 0, 0, false, "", "", "open");
}
