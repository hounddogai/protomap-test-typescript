/**
 * The fallback suppression audit records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback suppression audit is in its life cycle. */
export type FallbackSuppressionAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback suppression audit, with what the planners need to act on it. */
export class FallbackSuppressionAudit {
  code: string;
  title: string;
  ownerId: string;
  expiresAt: number;
  conversionRate: number;
  attempts: number;
  revision: number;
  impressions: number;
  cohort: string;
  pinned: boolean;
  status: FallbackSuppressionAuditStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    expiresAt: number,
    conversionRate: number,
    attempts: number,
    revision: number,
    impressions: number,
    cohort: string,
    pinned: boolean,
    status: FallbackSuppressionAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.expiresAt = expiresAt;
    this.conversionRate = conversionRate;
    this.attempts = attempts;
    this.revision = revision;
    this.impressions = impressions;
    this.cohort = cohort;
    this.pinned = pinned;
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

  canMoveTo(next: FallbackSuppressionAuditStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackSuppressionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback suppression audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"fallback suppression audit"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.conversionRate - this.expiresAt) * 100) / 100;
  }

  copy(): FallbackSuppressionAudit {
    return new FallbackSuppressionAudit(
      this.code,
      this.title,
      this.ownerId,
      this.expiresAt,
      this.conversionRate,
      this.attempts,
      this.revision,
      this.impressions,
      this.cohort,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback suppression audit in status open. */
export function newFallbackSuppressionAudit(code: string, title: string): FallbackSuppressionAudit {
  return new FallbackSuppressionAudit(code, title, "", 0, 0, 0, 0, 0, "", false, "open");
}
