/**
 * The legacy complaint preference records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy complaint preference is in its life cycle. */
export type LegacyComplaintPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy complaint preference. Its code is unique within a tenant. */
export class LegacyComplaintPreference {
  code: string;
  title: string;
  contactEmail: string;
  ownerId: string;
  variant: string;
  cohort: string;
  category: string;
  quantity: number;
  status: LegacyComplaintPreferenceStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    ownerId: string,
    variant: string,
    cohort: string,
    category: string,
    quantity: number,
    status: LegacyComplaintPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.ownerId = ownerId;
    this.variant = variant;
    this.cohort = cohort;
    this.category = category;
    this.quantity = quantity;
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

  canMoveTo(next: LegacyComplaintPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyComplaintPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy complaint preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy complaint preference"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): LegacyComplaintPreference {
    return new LegacyComplaintPreference(
      this.code,
      this.title,
      this.contactEmail,
      this.ownerId,
      this.variant,
      this.cohort,
      this.category,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy complaint preference in status requested. */
export function newLegacyComplaintPreference(code: string, title: string): LegacyComplaintPreference {
  return new LegacyComplaintPreference(code, title, "", "", "", "", "", 0, "requested");
}
