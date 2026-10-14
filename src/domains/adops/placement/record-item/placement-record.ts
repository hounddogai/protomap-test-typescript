/**
 * The placement record records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement record is in its life cycle. */
export type PlacementRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** A placement record as the placement team keeps it. */
export class PlacementRecord {
  code: string;
  name: string;
  archived: boolean;
  variant: string;
  notes: string;
  title: string;
  budget: number;
  conversionRate: number;
  campaignRef: string;
  ownerId: string;
  tags: string[];
  status: PlacementRecordStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    variant: string,
    notes: string,
    title: string,
    budget: number,
    conversionRate: number,
    campaignRef: string,
    ownerId: string,
    tags: string[],
    status: PlacementRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.variant = variant;
    this.notes = notes;
    this.title = title;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round(this.conversionRate * this.budget * 100) / 100;
  }

  copy(): PlacementRecord {
    return new PlacementRecord(
      this.code,
      this.name,
      this.archived,
      this.variant,
      this.notes,
      this.title,
      this.budget,
      this.conversionRate,
      this.campaignRef,
      this.ownerId,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a placement record in status requested. */
export function newPlacementRecord(code: string, name: string): PlacementRecord {
  return new PlacementRecord(code, name, false, "", "", "", 0, 0, "", "", [], "requested");
}
