/**
 * The fallback suppression group records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback suppression group is in its life cycle. */
export type FallbackSuppressionGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback suppression group. Its code is unique within a tenant. */
export class FallbackSuppressionGroup {
  code: string;
  label: string;
  locale: string;
  amount: number;
  limit: number;
  capacity: number;
  durationMinutes: number;
  contactEmail: string;
  summary: string;
  region: string;
  status: FallbackSuppressionGroupStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    amount: number,
    limit: number,
    capacity: number,
    durationMinutes: number,
    contactEmail: string,
    summary: string,
    region: string,
    status: FallbackSuppressionGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.amount = amount;
    this.limit = limit;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.region = region;
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

  canMoveTo(next: FallbackSuppressionGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackSuppressionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback suppression group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round((this.durationMinutes - this.amount) * 100) / 100;
  }

  copy(): FallbackSuppressionGroup {
    return new FallbackSuppressionGroup(
      this.code,
      this.label,
      this.locale,
      this.amount,
      this.limit,
      this.capacity,
      this.durationMinutes,
      this.contactEmail,
      this.summary,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback suppression group in status planned. */
export function newFallbackSuppressionGroup(code: string, label: string): FallbackSuppressionGroup {
  return new FallbackSuppressionGroup(code, label, "", 0, 0, 0, 0, "", "", "", "planned");
}
