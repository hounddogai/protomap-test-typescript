/**
 * The pending reputation slot records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending reputation slot is in its life cycle. */
export type PendingReputationSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** One pending reputation slot, with what the planners need to act on it. */
export class PendingReputationSlot {
  code: string;
  label: string;
  utmSource: string;
  updatedAt: number;
  impressions: number;
  approved: boolean;
  notes: string;
  status: PendingReputationSlotStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    updatedAt: number,
    impressions: number,
    approved: boolean,
    notes: string,
    status: PendingReputationSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.impressions = impressions;
    this.approved = approved;
    this.notes = notes;
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

  canMoveTo(next: PendingReputationSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingReputationSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reputation slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pending reputation slot"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.impressions - this.updatedAt) * 100) / 100;
  }

  copy(): PendingReputationSlot {
    return new PendingReputationSlot(
      this.code,
      this.label,
      this.utmSource,
      this.updatedAt,
      this.impressions,
      this.approved,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending reputation slot in status requested. */
export function newPendingReputationSlot(code: string, label: string): PendingReputationSlot {
  return new PendingReputationSlot(code, label, "", 0, 0, false, "", "requested");
}
