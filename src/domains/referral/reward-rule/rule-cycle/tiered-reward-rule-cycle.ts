/**
 * The tiered reward rule cycle records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered reward rule cycle is in its life cycle. */
export type TieredRewardRuleCycleStatus = "created" | "validated" | "published" | "retired";

/** A tiered reward rule cycle. Its code is unique within a tenant. */
export class TieredRewardRuleCycle {
  code: string;
  name: string;
  updatedAt: number;
  version: number;
  ratio: number;
  rate: number;
  limit: number;
  archived: boolean;
  audienceId: string;
  floorValue: number;
  revision: number;
  status: TieredRewardRuleCycleStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    version: number,
    ratio: number,
    rate: number,
    limit: number,
    archived: boolean,
    audienceId: string,
    floorValue: number,
    revision: number,
    status: TieredRewardRuleCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.version = version;
    this.ratio = ratio;
    this.rate = rate;
    this.limit = limit;
    this.archived = archived;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.revision = revision;
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

  canMoveTo(next: TieredRewardRuleCycleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredRewardRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"tiered reward rule cycle"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.ratio + this.floorValue) * 100) / 100;
  }

  copy(): TieredRewardRuleCycle {
    return new TieredRewardRuleCycle(
      this.code,
      this.name,
      this.updatedAt,
      this.version,
      this.ratio,
      this.rate,
      this.limit,
      this.archived,
      this.audienceId,
      this.floorValue,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered reward rule cycle in status created. */
export function newTieredRewardRuleCycle(code: string, name: string): TieredRewardRuleCycle {
  return new TieredRewardRuleCycle(code, name, 0, 0, 0, 0, 0, false, "", 0, 0, "created");
}
