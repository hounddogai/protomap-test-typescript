/**
 * The manual retention quota records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual retention quota is in its life cycle. */
export type ManualRetentionQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual retention quota as the retention team keeps it. */
export class ManualRetentionQuota {
  code: string;
  title: string;
  batchSize: number;
  ownerId: string;
  channel: string;
  currency: string;
  source: string;
  status: ManualRetentionQuotaStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    ownerId: string,
    channel: string,
    currency: string,
    source: string,
    status: ManualRetentionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
    this.channel = channel;
    this.currency = currency;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualRetentionQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRetentionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual retention quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): ManualRetentionQuota {
    return new ManualRetentionQuota(
      this.code,
      this.title,
      this.batchSize,
      this.ownerId,
      this.channel,
      this.currency,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual retention quota in status open. */
export function newManualRetentionQuota(code: string, title: string): ManualRetentionQuota {
  return new ManualRetentionQuota(code, title, 0, "", "", "", "", "open");
}
