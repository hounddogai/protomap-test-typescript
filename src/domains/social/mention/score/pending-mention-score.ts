/**
 * The pending mention score records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending mention score is in its life cycle. */
export type PendingMentionScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending mention score. Its code is unique within a tenant. */
export class PendingMentionScore {
  code: string;
  title: string;
  checksum: string;
  country: string;
  version: number;
  attempts: number;
  status: PendingMentionScoreStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    country: string,
    version: number,
    attempts: number,
    status: PendingMentionScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.country = country;
    this.version = version;
    this.attempts = attempts;
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

  canMoveTo(next: PendingMentionScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingMentionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending mention score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.attempts + this.version) * 100) / 100;
  }

  copy(): PendingMentionScore {
    return new PendingMentionScore(
      this.code,
      this.title,
      this.checksum,
      this.country,
      this.version,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending mention score in status requested. */
export function newPendingMentionScore(code: string, title: string): PendingMentionScore {
  return new PendingMentionScore(code, title, "", "", 0, 0, "requested");
}
