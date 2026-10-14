/**
 * The leaderboard ledger records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard ledger is in its life cycle. */
export type LeaderboardLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** A leaderboard ledger as the leaderboard team keeps it. */
export class LeaderboardLedger {
  code: string;
  name: string;
  summary: string;
  description: string;
  pinned: boolean;
  contactEmail: string;
  createdAt: number;
  phone: string;
  margin: number;
  status: LeaderboardLedgerStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    description: string,
    pinned: boolean,
    contactEmail: string,
    createdAt: number,
    phone: string,
    margin: number,
    status: LeaderboardLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.description = description;
    this.pinned = pinned;
    this.contactEmail = contactEmail;
    this.createdAt = createdAt;
    this.phone = phone;
    this.margin = margin;
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

  canMoveTo(next: LeaderboardLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.margin + this.createdAt) * 100) / 100;
  }

  copy(): LeaderboardLedger {
    return new LeaderboardLedger(
      this.code,
      this.name,
      this.summary,
      this.description,
      this.pinned,
      this.contactEmail,
      this.createdAt,
      this.phone,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a leaderboard ledger in status requested. */
export function newLeaderboardLedger(code: string, name: string): LeaderboardLedger {
  return new LeaderboardLedger(code, name, "", "", false, "", 0, "", 0, "requested");
}
