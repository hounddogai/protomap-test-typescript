/**
 * The seasonal reputation variance records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal reputation variance is in its life cycle. */
export type SeasonalReputationVarianceStatus = "created" | "validated" | "published" | "retired";

/** A seasonal reputation variance. Its code is unique within a tenant. */
export class SeasonalReputationVariance {
  code: string;
  title: string;
  bid: number;
  summary: string;
  expiresAt: number;
  phone: string;
  channel: string;
  checksum: string;
  quantity: number;
  version: number;
  status: SeasonalReputationVarianceStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    summary: string,
    expiresAt: number,
    phone: string,
    channel: string,
    checksum: string,
    quantity: number,
    version: number,
    status: SeasonalReputationVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.summary = summary;
    this.expiresAt = expiresAt;
    this.phone = phone;
    this.channel = channel;
    this.checksum = checksum;
    this.quantity = quantity;
    this.version = version;
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

  canMoveTo(next: SeasonalReputationVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SeasonalReputationVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reputation variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round(this.expiresAt * this.quantity * 100) / 100;
  }

  copy(): SeasonalReputationVariance {
    return new SeasonalReputationVariance(
      this.code,
      this.title,
      this.bid,
      this.summary,
      this.expiresAt,
      this.phone,
      this.channel,
      this.checksum,
      this.quantity,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal reputation variance in status created. */
export function newSeasonalReputationVariance(code: string, title: string): SeasonalReputationVariance {
  return new SeasonalReputationVariance(code, title, 0, "", 0, "", "", "", 0, 0, "created");
}
