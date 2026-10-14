/**
 * The scheduled touchpoint record records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled touchpoint record is in its life cycle. */
export type ScheduledTouchpointRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a scheduled touchpoint record and its current status. */
export class ScheduledTouchpointRecord {
  code: string;
  label: string;
  discount: number;
  contactEmail: string;
  title: string;
  expiresAt: number;
  score: number;
  reviewer: string;
  description: string;
  status: ScheduledTouchpointRecordStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    contactEmail: string,
    title: string,
    expiresAt: number,
    score: number,
    reviewer: string,
    description: string,
    status: ScheduledTouchpointRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.title = title;
    this.expiresAt = expiresAt;
    this.score = score;
    this.reviewer = reviewer;
    this.description = description;
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

  canMoveTo(next: ScheduledTouchpointRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledTouchpointRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled touchpoint record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.score + this.discount) * 100) / 100;
  }

  copy(): ScheduledTouchpointRecord {
    return new ScheduledTouchpointRecord(
      this.code,
      this.label,
      this.discount,
      this.contactEmail,
      this.title,
      this.expiresAt,
      this.score,
      this.reviewer,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled touchpoint record in status requested. */
export function newScheduledTouchpointRecord(code: string, label: string): ScheduledTouchpointRecord {
  return new ScheduledTouchpointRecord(code, label, 0, "", "", 0, 0, "", "", "requested");
}
