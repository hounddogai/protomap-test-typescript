/**
 * The opt out quota records of consentcenter's opt out work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out quota is in its life cycle. */
export type OptOutQuotaStatus = "created" | "validated" | "published" | "retired";

/** A opt out quota as the opt out team keeps it. */
export class OptOutQuota {
  code: string;
  title: string;
  version: number;
  utmSource: string;
  bid: number;
  contactEmail: string;
  impressions: number;
  score: number;
  status: OptOutQuotaStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    utmSource: string,
    bid: number,
    contactEmail: string,
    impressions: number,
    score: number,
    status: OptOutQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.utmSource = utmSource;
    this.bid = bid;
    this.contactEmail = contactEmail;
    this.impressions = impressions;
    this.score = score;
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

  canMoveTo(next: OptOutQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round((this.version + this.impressions) * 100) / 100;
  }

  copy(): OptOutQuota {
    return new OptOutQuota(
      this.code,
      this.title,
      this.version,
      this.utmSource,
      this.bid,
      this.contactEmail,
      this.impressions,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a opt out quota in status created. */
export function newOptOutQuota(code: string, title: string): OptOutQuota {
  return new OptOutQuota(code, title, 0, "", 0, "", 0, 0, "created");
}
