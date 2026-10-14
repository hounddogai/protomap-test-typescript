/**
 * The legacy challenge override records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy challenge override is in its life cycle. */
export type LegacyChallengeOverrideStatus = "created" | "validated" | "published" | "retired";

/** A legacy challenge override. Its code is unique within a tenant. */
export class LegacyChallengeOverride {
  code: string;
  title: string;
  bid: number;
  sendAt: number;
  archived: boolean;
  maximum: number;
  cost: number;
  status: LegacyChallengeOverrideStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    sendAt: number,
    archived: boolean,
    maximum: number,
    cost: number,
    status: LegacyChallengeOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.sendAt = sendAt;
    this.archived = archived;
    this.maximum = maximum;
    this.cost = cost;
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

  canMoveTo(next: LegacyChallengeOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyChallengeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy challenge override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.maximum + this.sendAt) * 100) / 100;
  }

  copy(): LegacyChallengeOverride {
    return new LegacyChallengeOverride(
      this.code,
      this.title,
      this.bid,
      this.sendAt,
      this.archived,
      this.maximum,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy challenge override in status created. */
export function newLegacyChallengeOverride(code: string, title: string): LegacyChallengeOverride {
  return new LegacyChallengeOverride(code, title, 0, 0, false, 0, 0, "created");
}
