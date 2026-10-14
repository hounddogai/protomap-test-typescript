/**
 * The tiered warmup tier records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered warmup tier is in its life cycle. */
export type TieredWarmupTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered warmup tier. Its code is unique within a tenant. */
export class TieredWarmupTier {
  code: string;
  title: string;
  sendAt: number;
  audienceId: string;
  channel: string;
  locale: string;
  retries: number;
  reviewer: string;
  phone: string;
  status: TieredWarmupTierStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    audienceId: string,
    channel: string,
    locale: string,
    retries: number,
    reviewer: string,
    phone: string,
    status: TieredWarmupTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.audienceId = audienceId;
    this.channel = channel;
    this.locale = locale;
    this.retries = retries;
    this.reviewer = reviewer;
    this.phone = phone;
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

  canMoveTo(next: TieredWarmupTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredWarmupTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered warmup tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedVolume(): number {
    return Math.round((this.retries - this.sendAt) * 100) / 100;
  }

  copy(): TieredWarmupTier {
    return new TieredWarmupTier(
      this.code,
      this.title,
      this.sendAt,
      this.audienceId,
      this.channel,
      this.locale,
      this.retries,
      this.reviewer,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered warmup tier in status new. */
export function newTieredWarmupTier(code: string, title: string): TieredWarmupTier {
  return new TieredWarmupTier(code, title, 0, "", "", "", 0, "", "", "new");
}
