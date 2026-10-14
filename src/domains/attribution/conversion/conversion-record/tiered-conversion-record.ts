/**
 * The tiered conversion record records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered conversion record is in its life cycle. */
export type TieredConversionRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered conversion record. Its code is unique within a tenant. */
export class TieredConversionRecord {
  code: string;
  name: string;
  sendAt: number;
  endsAt: number;
  segment: string;
  approved: boolean;
  contactEmail: string;
  summary: string;
  updatedAt: number;
  quantity: number;
  status: TieredConversionRecordStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    endsAt: number,
    segment: string,
    approved: boolean,
    contactEmail: string,
    summary: string,
    updatedAt: number,
    quantity: number,
    status: TieredConversionRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.segment = segment;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.updatedAt = updatedAt;
    this.quantity = quantity;
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

  canMoveTo(next: TieredConversionRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredConversionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered conversion record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.updatedAt - this.endsAt) * 100) / 100;
  }

  copy(): TieredConversionRecord {
    return new TieredConversionRecord(
      this.code,
      this.name,
      this.sendAt,
      this.endsAt,
      this.segment,
      this.approved,
      this.contactEmail,
      this.summary,
      this.updatedAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered conversion record in status planned. */
export function newTieredConversionRecord(code: string, name: string): TieredConversionRecord {
  return new TieredConversionRecord(code, name, 0, 0, "", false, "", "", 0, 0, "planned");
}
