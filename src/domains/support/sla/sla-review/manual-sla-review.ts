/**
 * The manual sla review records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual sla review is in its life cycle. */
export type ManualSlaReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a manual sla review and its current status. */
export class ManualSlaReview {
  code: string;
  title: string;
  updatedAt: number;
  sendAt: number;
  durationMinutes: number;
  timezone: string;
  source: string;
  floorValue: number;
  conversionRate: number;
  contactEmail: string;
  approved: boolean;
  status: ManualSlaReviewStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    sendAt: number,
    durationMinutes: number,
    timezone: string,
    source: string,
    floorValue: number,
    conversionRate: number,
    contactEmail: string,
    approved: boolean,
    status: ManualSlaReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
    this.timezone = timezone;
    this.source = source;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.contactEmail = contactEmail;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualSlaReviewStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualSlaReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual sla review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round((this.conversionRate - this.sendAt) * 100) / 100;
  }

  copy(): ManualSlaReview {
    return new ManualSlaReview(
      this.code,
      this.title,
      this.updatedAt,
      this.sendAt,
      this.durationMinutes,
      this.timezone,
      this.source,
      this.floorValue,
      this.conversionRate,
      this.contactEmail,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual sla review in status open. */
export function newManualSlaReview(code: string, title: string): ManualSlaReview {
  return new ManualSlaReview(code, title, 0, 0, 0, "", "", 0, 0, "", false, "open");
}
