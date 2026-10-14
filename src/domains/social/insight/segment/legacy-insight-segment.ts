/**
 * The legacy insight segment records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy insight segment is in its life cycle. */
export type LegacyInsightSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy insight segment. Its code is unique within a tenant. */
export class LegacyInsightSegment {
  code: string;
  title: string;
  windowDays: number;
  journeyId: string;
  locale: string;
  expiresAt: number;
  timezone: string;
  ownerId: string;
  status: LegacyInsightSegmentStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    journeyId: string,
    locale: string,
    expiresAt: number,
    timezone: string,
    ownerId: string,
    status: LegacyInsightSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.journeyId = journeyId;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyInsightSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyInsightSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy insight segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netExposure(): number {
    return Math.round((this.expiresAt - this.windowDays) * 100) / 100;
  }

  copy(): LegacyInsightSegment {
    return new LegacyInsightSegment(
      this.code,
      this.title,
      this.windowDays,
      this.journeyId,
      this.locale,
      this.expiresAt,
      this.timezone,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy insight segment in status draft. */
export function newLegacyInsightSegment(code: string, title: string): LegacyInsightSegment {
  return new LegacyInsightSegment(code, title, 0, "", "", 0, "", "", "draft");
}
