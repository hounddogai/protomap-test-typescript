/**
 * The sender variance records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender variance is in its life cycle. */
export type SenderVarianceStatus = "created" | "validated" | "published" | "retired";

/** The record of a sender variance and its current status. */
export class SenderVariance {
  code: string;
  title: string;
  checksum: string;
  ceiling: number;
  channel: string;
  expiresAt: number;
  version: number;
  region: string;
  quantity: number;
  revision: number;
  status: SenderVarianceStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    ceiling: number,
    channel: string,
    expiresAt: number,
    version: number,
    region: string,
    quantity: number,
    revision: number,
    status: SenderVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.ceiling = ceiling;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.version = version;
    this.region = region;
    this.quantity = quantity;
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

  canMoveTo(next: SenderVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SenderVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"sender variance"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.expiresAt + this.version) * 100) / 100;
  }

  copy(): SenderVariance {
    return new SenderVariance(
      this.code,
      this.title,
      this.checksum,
      this.ceiling,
      this.channel,
      this.expiresAt,
      this.version,
      this.region,
      this.quantity,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sender variance in status created. */
export function newSenderVariance(code: string, title: string): SenderVariance {
  return new SenderVariance(code, title, "", 0, "", 0, 0, "", 0, 0, "created");
}
