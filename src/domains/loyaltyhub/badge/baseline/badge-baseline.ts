/**
 * The badge baseline records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge baseline is in its life cycle. */
export type BadgeBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** A badge baseline. Its code is unique within a tenant. */
export class BadgeBaseline {
  code: string;
  name: string;
  clicks: number;
  reviewer: string;
  rate: number;
  startsAt: number;
  journeyId: string;
  limit: number;
  quantity: number;
  version: number;
  status: BadgeBaselineStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    reviewer: string,
    rate: number,
    startsAt: number,
    journeyId: string,
    limit: number,
    quantity: number,
    version: number,
    status: BadgeBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.rate = rate;
    this.startsAt = startsAt;
    this.journeyId = journeyId;
    this.limit = limit;
    this.quantity = quantity;
    this.version = version;
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

  canMoveTo(next: BadgeBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BadgeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round((this.quantity + this.limit) * 100) / 100;
  }

  copy(): BadgeBaseline {
    return new BadgeBaseline(
      this.code,
      this.name,
      this.clicks,
      this.reviewer,
      this.rate,
      this.startsAt,
      this.journeyId,
      this.limit,
      this.quantity,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a badge baseline in status requested. */
export function newBadgeBaseline(code: string, name: string): BadgeBaseline {
  return new BadgeBaseline(code, name, 0, "", 0, 0, "", 0, 0, 0, "requested");
}
