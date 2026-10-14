/**
 * The tiered reply profile records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered reply profile is in its life cycle. */
export type TieredReplyProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered reply profile as the reply team keeps it. */
export class TieredReplyProfile {
  code: string;
  title: string;
  graceDays: number;
  category: string;
  batchSize: number;
  windowDays: number;
  ownerId: string;
  frequencyCap: number;
  status: TieredReplyProfileStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    category: string,
    batchSize: number,
    windowDays: number,
    ownerId: string,
    frequencyCap: number,
    status: TieredReplyProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.category = category;
    this.batchSize = batchSize;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: TieredReplyProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: TieredReplyProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reply profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round(this.frequencyCap * this.windowDays * 100) / 100;
  }

  copy(): TieredReplyProfile {
    return new TieredReplyProfile(
      this.code,
      this.title,
      this.graceDays,
      this.category,
      this.batchSize,
      this.windowDays,
      this.ownerId,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered reply profile in status draft. */
export function newTieredReplyProfile(code: string, title: string): TieredReplyProfile {
  return new TieredReplyProfile(code, title, 0, "", 0, 0, "", 0, "draft");
}
