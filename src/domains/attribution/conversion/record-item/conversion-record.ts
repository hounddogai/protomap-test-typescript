/**
 * The conversion record records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion record is in its life cycle. */
export type ConversionRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A conversion record. Its code is unique within a tenant. */
export class ConversionRecord {
  code: string;
  title: string;
  budget: number;
  score: number;
  contactEmail: string;
  limit: number;
  status: ConversionRecordStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    score: number,
    contactEmail: string,
    limit: number,
    status: ConversionRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.score = score;
    this.contactEmail = contactEmail;
    this.limit = limit;
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

  canMoveTo(next: ConversionRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netVolume(): number {
    return Math.round((this.budget - this.limit) * 100) / 100;
  }

  copy(): ConversionRecord {
    return new ConversionRecord(
      this.code,
      this.title,
      this.budget,
      this.score,
      this.contactEmail,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a conversion record in status draft. */
export function newConversionRecord(code: string, title: string): ConversionRecord {
  return new ConversionRecord(code, title, 0, 0, "", 0, "draft");
}
