/**
 * The complaint claim records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint claim is in its life cycle. */
export type ComplaintClaimStatus = "created" | "validated" | "published" | "retired";

/** A complaint claim as the complaint team keeps it. */
export class ComplaintClaim {
  code: string;
  title: string;
  phone: string;
  campaignRef: string;
  category: string;
  region: string;
  durationMinutes: number;
  externalRef: string;
  label: string;
  amount: number;
  status: ComplaintClaimStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    campaignRef: string,
    category: string,
    region: string,
    durationMinutes: number,
    externalRef: string,
    label: string,
    amount: number,
    status: ComplaintClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.campaignRef = campaignRef;
    this.category = category;
    this.region = region;
    this.durationMinutes = durationMinutes;
    this.externalRef = externalRef;
    this.label = label;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ComplaintClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ComplaintClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  netTotal(): number {
    return Math.round(this.amount * this.durationMinutes * 100) / 100;
  }

  copy(): ComplaintClaim {
    return new ComplaintClaim(
      this.code,
      this.title,
      this.phone,
      this.campaignRef,
      this.category,
      this.region,
      this.durationMinutes,
      this.externalRef,
      this.label,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a complaint claim in status created. */
export function newComplaintClaim(code: string, title: string): ComplaintClaim {
  return new ComplaintClaim(code, title, "", "", "", "", 0, "", "", 0, "created");
}
