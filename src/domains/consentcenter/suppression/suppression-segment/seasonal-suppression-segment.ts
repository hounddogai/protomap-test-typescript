/**
 * The seasonal suppression segment records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal suppression segment is in its life cycle. */
export type SeasonalSuppressionSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal suppression segment as the suppression team keeps it. */
export class SeasonalSuppressionSegment {
  code: string;
  title: string;
  ownerId: string;
  margin: number;
  audienceId: string;
  conversionRate: number;
  expiresAt: number;
  currency: string;
  contactEmail: string;
  status: SeasonalSuppressionSegmentStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    margin: number,
    audienceId: string,
    conversionRate: number,
    expiresAt: number,
    currency: string,
    contactEmail: string,
    status: SeasonalSuppressionSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.margin = margin;
    this.audienceId = audienceId;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: SeasonalSuppressionSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalSuppressionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal suppression segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.margin * this.expiresAt * 100) / 100;
  }

  copy(): SeasonalSuppressionSegment {
    return new SeasonalSuppressionSegment(
      this.code,
      this.title,
      this.ownerId,
      this.margin,
      this.audienceId,
      this.conversionRate,
      this.expiresAt,
      this.currency,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal suppression segment in status draft. */
export function newSeasonalSuppressionSegment(code: string, title: string): SeasonalSuppressionSegment {
  return new SeasonalSuppressionSegment(code, title, "", 0, "", 0, 0, "", "", "draft");
}
