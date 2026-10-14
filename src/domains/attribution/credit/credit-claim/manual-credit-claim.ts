/**
 * The manual credit claim records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual credit claim is in its life cycle. */
export type ManualCreditClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual credit claim and its current status. */
export class ManualCreditClaim {
  code: string;
  label: string;
  notes: string;
  description: string;
  sendAt: number;
  category: string;
  windowDays: number;
  pinned: boolean;
  maximum: number;
  limit: number;
  status: ManualCreditClaimStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    description: string,
    sendAt: number,
    category: string,
    windowDays: number,
    pinned: boolean,
    maximum: number,
    limit: number,
    status: ManualCreditClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.description = description;
    this.sendAt = sendAt;
    this.category = category;
    this.windowDays = windowDays;
    this.pinned = pinned;
    this.maximum = maximum;
    this.limit = limit;
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

  canMoveTo(next: ManualCreditClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: ManualCreditClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual credit claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.windowDays + this.sendAt) * 100) / 100;
  }

  copy(): ManualCreditClaim {
    return new ManualCreditClaim(
      this.code,
      this.label,
      this.notes,
      this.description,
      this.sendAt,
      this.category,
      this.windowDays,
      this.pinned,
      this.maximum,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual credit claim in status requested. */
export function newManualCreditClaim(code: string, label: string): ManualCreditClaim {
  return new ManualCreditClaim(code, label, "", "", 0, "", 0, false, 0, 0, "requested");
}
