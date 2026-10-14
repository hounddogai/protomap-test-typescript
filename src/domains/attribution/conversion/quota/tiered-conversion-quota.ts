/**
 * The tiered conversion quota records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered conversion quota is in its life cycle. */
export type TieredConversionQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tiered conversion quota, with what the planners need to act on it. */
export class TieredConversionQuota {
  code: string;
  label: string;
  reviewer: string;
  journeyId: string;
  channel: string;
  amount: number;
  name: string;
  weight: number;
  contactEmail: string;
  checksum: string;
  status: TieredConversionQuotaStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    journeyId: string,
    channel: string,
    amount: number,
    name: string,
    weight: number,
    contactEmail: string,
    checksum: string,
    status: TieredConversionQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.channel = channel;
    this.amount = amount;
    this.name = name;
    this.weight = weight;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
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

  canMoveTo(next: TieredConversionQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredConversionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered conversion quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.amount - this.weight) * 100) / 100;
  }

  copy(): TieredConversionQuota {
    return new TieredConversionQuota(
      this.code,
      this.label,
      this.reviewer,
      this.journeyId,
      this.channel,
      this.amount,
      this.name,
      this.weight,
      this.contactEmail,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered conversion quota in status new. */
export function newTieredConversionQuota(code: string, label: string): TieredConversionQuota {
  return new TieredConversionQuota(code, label, "", "", "", 0, "", 0, "", "", "new");
}
