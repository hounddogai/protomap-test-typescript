/**
 * The suppression request records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression request is in its life cycle. */
export type SuppressionRequestStatus = "created" | "validated" | "published" | "retired";

/** A suppression request as the suppression team keeps it. */
export class SuppressionRequest {
  code: string;
  label: string;
  timezone: string;
  score: number;
  approved: boolean;
  floorValue: number;
  clicks: number;
  expiresAt: number;
  journeyId: string;
  status: SuppressionRequestStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    score: number,
    approved: boolean,
    floorValue: number,
    clicks: number,
    expiresAt: number,
    journeyId: string,
    status: SuppressionRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.score = score;
    this.approved = approved;
    this.floorValue = floorValue;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.journeyId = journeyId;
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

  canMoveTo(next: SuppressionRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"suppression request"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.score - this.expiresAt) * 100) / 100;
  }

  copy(): SuppressionRequest {
    return new SuppressionRequest(
      this.code,
      this.label,
      this.timezone,
      this.score,
      this.approved,
      this.floorValue,
      this.clicks,
      this.expiresAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression request in status created. */
export function newSuppressionRequest(code: string, label: string): SuppressionRequest {
  return new SuppressionRequest(code, label, "", 0, false, 0, 0, 0, "", "created");
}
