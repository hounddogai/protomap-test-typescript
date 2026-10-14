/**
 * The pending badge audit records of loyaltyhub's badge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending badge audit is in its life cycle. */
export type PendingBadgeAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** One pending badge audit, with what the planners need to act on it. */
export class PendingBadgeAudit {
  code: string;
  title: string;
  startsAt: number;
  amount: number;
  variant: string;
  timezone: string;
  createdAt: number;
  approved: boolean;
  name: string;
  currency: string;
  status: PendingBadgeAuditStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    amount: number,
    variant: string,
    timezone: string,
    createdAt: number,
    approved: boolean,
    name: string,
    currency: string,
    status: PendingBadgeAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.amount = amount;
    this.variant = variant;
    this.timezone = timezone;
    this.createdAt = createdAt;
    this.approved = approved;
    this.name = name;
    this.currency = currency;
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

  canMoveTo(next: PendingBadgeAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingBadgeAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending badge audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedLoad(): number {
    return Math.round((this.startsAt + this.createdAt) * 100) / 100;
  }

  copy(): PendingBadgeAudit {
    return new PendingBadgeAudit(
      this.code,
      this.title,
      this.startsAt,
      this.amount,
      this.variant,
      this.timezone,
      this.createdAt,
      this.approved,
      this.name,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending badge audit in status requested. */
export function newPendingBadgeAudit(code: string, title: string): PendingBadgeAudit {
  return new PendingBadgeAudit(code, title, 0, 0, "", "", 0, false, "", "", "requested");
}
