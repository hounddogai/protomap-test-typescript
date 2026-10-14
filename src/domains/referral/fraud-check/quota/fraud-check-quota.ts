/**
 * The fraud check quota records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check quota is in its life cycle. */
export type FraudCheckQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fraud check quota. Its code is unique within a tenant. */
export class FraudCheckQuota {
  code: string;
  name: string;
  locale: string;
  sequence: number;
  channel: string;
  expiresAt: number;
  tags: string[];
  cost: number;
  sendAt: number;
  reviewer: string;
  status: FraudCheckQuotaStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    sequence: number,
    channel: string,
    expiresAt: number,
    tags: string[],
    cost: number,
    sendAt: number,
    reviewer: string,
    status: FraudCheckQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.sequence = sequence;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.tags = tags;
    this.cost = cost;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
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

  canMoveTo(next: FraudCheckQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.cost + this.sequence) * 100) / 100;
  }

  copy(): FraudCheckQuota {
    return new FraudCheckQuota(
      this.code,
      this.name,
      this.locale,
      this.sequence,
      this.channel,
      this.expiresAt,
      this.tags,
      this.cost,
      this.sendAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fraud check quota in status new. */
export function newFraudCheckQuota(code: string, name: string): FraudCheckQuota {
  return new FraudCheckQuota(code, name, "", 0, "", 0, [], 0, 0, "", "new");
}
