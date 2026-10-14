/**
 * The strict complaint mapping records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict complaint mapping is in its life cycle. */
export type StrictComplaintMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a strict complaint mapping and its current status. */
export class StrictComplaintMapping {
  code: string;
  name: string;
  capacity: number;
  currency: string;
  openRate: number;
  notes: string;
  archived: boolean;
  region: string;
  attempts: number;
  status: StrictComplaintMappingStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    currency: string,
    openRate: number,
    notes: string,
    archived: boolean,
    region: string,
    attempts: number,
    status: StrictComplaintMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.currency = currency;
    this.openRate = openRate;
    this.notes = notes;
    this.archived = archived;
    this.region = region;
    this.attempts = attempts;
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

  canMoveTo(next: StrictComplaintMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictComplaintMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict complaint mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.attempts * this.openRate * 100) / 100;
  }

  copy(): StrictComplaintMapping {
    return new StrictComplaintMapping(
      this.code,
      this.name,
      this.capacity,
      this.currency,
      this.openRate,
      this.notes,
      this.archived,
      this.region,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict complaint mapping in status planned. */
export function newStrictComplaintMapping(code: string, name: string): StrictComplaintMapping {
  return new StrictComplaintMapping(code, name, 0, "", 0, "", false, "", 0, "planned");
}
