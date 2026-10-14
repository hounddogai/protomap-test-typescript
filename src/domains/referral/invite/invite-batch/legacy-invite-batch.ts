/**
 * The legacy invite batch records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy invite batch is in its life cycle. */
export type LegacyInviteBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy invite batch as the invite team keeps it. */
export class LegacyInviteBatch {
  code: string;
  name: string;
  archived: boolean;
  region: string;
  conversionRate: number;
  clicks: number;
  status: LegacyInviteBatchStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    region: string,
    conversionRate: number,
    clicks: number,
    status: LegacyInviteBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.region = region;
    this.conversionRate = conversionRate;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyInviteBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyInviteBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy invite batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.conversionRate + this.clicks) * 100) / 100;
  }

  copy(): LegacyInviteBatch {
    return new LegacyInviteBatch(
      this.code,
      this.name,
      this.archived,
      this.region,
      this.conversionRate,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy invite batch in status new. */
export function newLegacyInviteBatch(code: string, name: string): LegacyInviteBatch {
  return new LegacyInviteBatch(code, name, false, "", 0, 0, "new");
}
