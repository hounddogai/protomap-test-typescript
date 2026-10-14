/**
 * The complaint entry records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint entry is in its life cycle. */
export type ComplaintEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** A complaint entry. Its code is unique within a tenant. */
export class ComplaintEntry {
  code: string;
  label: string;
  visible: boolean;
  priority: number;
  retries: number;
  amount: number;
  approved: boolean;
  contactEmail: string;
  audienceId: string;
  capacity: number;
  unit: string;
  status: ComplaintEntryStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    priority: number,
    retries: number,
    amount: number,
    approved: boolean,
    contactEmail: string,
    audienceId: string,
    capacity: number,
    unit: string,
    status: ComplaintEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.priority = priority;
    this.retries = retries;
    this.amount = amount;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.audienceId = audienceId;
    this.capacity = capacity;
    this.unit = unit;
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

  canMoveTo(next: ComplaintEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.priority + this.capacity) * 100) / 100;
  }

  copy(): ComplaintEntry {
    return new ComplaintEntry(
      this.code,
      this.label,
      this.visible,
      this.priority,
      this.retries,
      this.amount,
      this.approved,
      this.contactEmail,
      this.audienceId,
      this.capacity,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a complaint entry in status requested. */
export function newComplaintEntry(code: string, label: string): ComplaintEntry {
  return new ComplaintEntry(code, label, false, 0, 0, 0, false, "", "", 0, "", "requested");
}
