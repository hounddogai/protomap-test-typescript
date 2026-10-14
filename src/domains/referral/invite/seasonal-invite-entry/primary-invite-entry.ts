/**
 * The primary invite entry records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary invite entry is in its life cycle. */
export type PrimaryInviteEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary invite entry. Its code is unique within a tenant. */
export class PrimaryInviteEntry {
  code: string;
  title: string;
  ceiling: number;
  amount: number;
  tags: string[];
  graceDays: number;
  journeyId: string;
  sequence: number;
  status: PrimaryInviteEntryStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    amount: number,
    tags: string[],
    graceDays: number,
    journeyId: string,
    sequence: number,
    status: PrimaryInviteEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.amount = amount;
    this.tags = tags;
    this.graceDays = graceDays;
    this.journeyId = journeyId;
    this.sequence = sequence;
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

  canMoveTo(next: PrimaryInviteEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryInviteEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary invite entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.graceDays - this.amount) * 100) / 100;
  }

  copy(): PrimaryInviteEntry {
    return new PrimaryInviteEntry(
      this.code,
      this.title,
      this.ceiling,
      this.amount,
      this.tags,
      this.graceDays,
      this.journeyId,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary invite entry in status draft. */
export function newPrimaryInviteEntry(code: string, title: string): PrimaryInviteEntry {
  return new PrimaryInviteEntry(code, title, 0, 0, [], 0, "", 0, "draft");
}
