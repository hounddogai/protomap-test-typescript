/**
 * The fallback bid rule snapshot records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback bid rule snapshot is in its life cycle. */
export type FallbackBidRuleSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a fallback bid rule snapshot and its current status. */
export class FallbackBidRuleSnapshot {
  code: string;
  name: string;
  tags: string[];
  timezone: string;
  updatedAt: number;
  amount: number;
  archived: boolean;
  channel: string;
  status: FallbackBidRuleSnapshotStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    timezone: string,
    updatedAt: number,
    amount: number,
    archived: boolean,
    channel: string,
    status: FallbackBidRuleSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.archived = archived;
    this.channel = channel;
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

  canMoveTo(next: FallbackBidRuleSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackBidRuleSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bid rule snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.amount + this.updatedAt) * 100) / 100;
  }

  copy(): FallbackBidRuleSnapshot {
    return new FallbackBidRuleSnapshot(
      this.code,
      this.name,
      this.tags,
      this.timezone,
      this.updatedAt,
      this.amount,
      this.archived,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback bid rule snapshot in status requested. */
export function newFallbackBidRuleSnapshot(code: string, name: string): FallbackBidRuleSnapshot {
  return new FallbackBidRuleSnapshot(code, name, [], "", 0, 0, false, "", "requested");
}
