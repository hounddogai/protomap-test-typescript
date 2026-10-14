/**
 * The legacy challenge target records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy challenge target is in its life cycle. */
export type LegacyChallengeTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy challenge target as the challenge team keeps it. */
export class LegacyChallengeTarget {
  code: string;
  title: string;
  priority: number;
  quantity: number;
  reviewer: string;
  locale: string;
  checksum: string;
  capacity: number;
  sendAt: number;
  graceDays: number;
  clicks: number;
  status: LegacyChallengeTargetStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    quantity: number,
    reviewer: string,
    locale: string,
    checksum: string,
    capacity: number,
    sendAt: number,
    graceDays: number,
    clicks: number,
    status: LegacyChallengeTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.locale = locale;
    this.checksum = checksum;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyChallengeTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacyChallengeTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy challenge target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.sendAt * this.priority * 100) / 100;
  }

  copy(): LegacyChallengeTarget {
    return new LegacyChallengeTarget(
      this.code,
      this.title,
      this.priority,
      this.quantity,
      this.reviewer,
      this.locale,
      this.checksum,
      this.capacity,
      this.sendAt,
      this.graceDays,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy challenge target in status proposed. */
export function newLegacyChallengeTarget(code: string, title: string): LegacyChallengeTarget {
  return new LegacyChallengeTarget(code, title, 0, 0, "", "", "", 0, 0, 0, 0, "proposed");
}
