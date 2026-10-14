/**
 * The approval preference records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval preference is in its life cycle. */
export type ApprovalPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** One approval preference, with what the planners need to act on it. */
export class ApprovalPreference {
  code: string;
  label: string;
  utmSource: string;
  title: string;
  startsAt: number;
  externalRef: string;
  capacity: number;
  contactEmail: string;
  impressions: number;
  createdAt: number;
  status: ApprovalPreferenceStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    title: string,
    startsAt: number,
    externalRef: string,
    capacity: number,
    contactEmail: string,
    impressions: number,
    createdAt: number,
    status: ApprovalPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.title = title;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.impressions = impressions;
    this.createdAt = createdAt;
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

  canMoveTo(next: ApprovalPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ApprovalPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"approval preference"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.impressions + this.startsAt) * 100) / 100;
  }

  copy(): ApprovalPreference {
    return new ApprovalPreference(
      this.code,
      this.label,
      this.utmSource,
      this.title,
      this.startsAt,
      this.externalRef,
      this.capacity,
      this.contactEmail,
      this.impressions,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a approval preference in status requested. */
export function newApprovalPreference(code: string, label: string): ApprovalPreference {
  return new ApprovalPreference(code, label, "", "", 0, "", 0, "", 0, 0, "requested");
}
