/**
 * The retention audit records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention audit is in its life cycle. */
export type RetentionAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A retention audit. Its code is unique within a tenant. */
export class RetentionAudit {
  code: string;
  title: string;
  endsAt: number;
  startsAt: number;
  margin: number;
  windowDays: number;
  status: RetentionAuditStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    startsAt: number,
    margin: number,
    windowDays: number,
    status: RetentionAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.startsAt = startsAt;
    this.margin = margin;
    this.windowDays = windowDays;
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

  canMoveTo(next: RetentionAuditStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"retention audit"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.windowDays + this.endsAt) * 100) / 100;
  }

  copy(): RetentionAudit {
    return new RetentionAudit(
      this.code,
      this.title,
      this.endsAt,
      this.startsAt,
      this.margin,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a retention audit in status open. */
export function newRetentionAudit(code: string, title: string): RetentionAudit {
  return new RetentionAudit(code, title, 0, 0, 0, 0, "open");
}
