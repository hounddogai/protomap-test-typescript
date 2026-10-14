/**
 * The tiered macro record records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered macro record is in its life cycle. */
export type TieredMacroRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered macro record. Its code is unique within a tenant. */
export class TieredMacroRecord {
  code: string;
  label: string;
  threshold: number;
  title: string;
  notes: string;
  source: string;
  ceiling: number;
  campaignRef: string;
  capacity: number;
  rate: number;
  sendAt: number;
  status: TieredMacroRecordStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    title: string,
    notes: string,
    source: string,
    ceiling: number,
    campaignRef: string,
    capacity: number,
    rate: number,
    sendAt: number,
    status: TieredMacroRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.title = title;
    this.notes = notes;
    this.source = source;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.rate = rate;
    this.sendAt = sendAt;
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

  canMoveTo(next: TieredMacroRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredMacroRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered macro record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round((this.capacity + this.threshold) * 100) / 100;
  }

  copy(): TieredMacroRecord {
    return new TieredMacroRecord(
      this.code,
      this.label,
      this.threshold,
      this.title,
      this.notes,
      this.source,
      this.ceiling,
      this.campaignRef,
      this.capacity,
      this.rate,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered macro record in status planned. */
export function newTieredMacroRecord(code: string, label: string): TieredMacroRecord {
  return new TieredMacroRecord(code, label, 0, "", "", "", 0, "", 0, 0, 0, "planned");
}
