/**
 * The badge notice records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge notice is in its life cycle. */
export type BadgeNoticeStatus = "created" | "validated" | "published" | "retired";

/** The record of a badge notice and its current status. */
export class BadgeNotice {
  code: string;
  label: string;
  category: string;
  discount: number;
  journeyId: string;
  utmSource: string;
  openRate: number;
  notes: string;
  status: BadgeNoticeStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    discount: number,
    journeyId: string,
    utmSource: string,
    openRate: number,
    notes: string,
    status: BadgeNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.discount = discount;
    this.journeyId = journeyId;
    this.utmSource = utmSource;
    this.openRate = openRate;
    this.notes = notes;
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

  canMoveTo(next: BadgeNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BadgeNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.openRate - this.discount) * 100) / 100;
  }

  copy(): BadgeNotice {
    return new BadgeNotice(
      this.code,
      this.label,
      this.category,
      this.discount,
      this.journeyId,
      this.utmSource,
      this.openRate,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a badge notice in status created. */
export function newBadgeNotice(code: string, label: string): BadgeNotice {
  return new BadgeNotice(code, label, "", 0, "", "", 0, "", "created");
}
