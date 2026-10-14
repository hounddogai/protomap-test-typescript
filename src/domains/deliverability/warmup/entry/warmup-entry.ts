/**
 * The warmup entry records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup entry is in its life cycle. */
export type WarmupEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a warmup entry and its current status. */
export class WarmupEntry {
  code: string;
  title: string;
  locale: string;
  externalRef: string;
  retries: number;
  durationMinutes: number;
  bid: number;
  maximum: number;
  campaignRef: string;
  ceiling: number;
  active: boolean;
  status: WarmupEntryStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    externalRef: string,
    retries: number,
    durationMinutes: number,
    bid: number,
    maximum: number,
    campaignRef: string,
    ceiling: number,
    active: boolean,
    status: WarmupEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.externalRef = externalRef;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
    this.maximum = maximum;
    this.campaignRef = campaignRef;
    this.ceiling = ceiling;
    this.active = active;
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

  canMoveTo(next: WarmupEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedExposure(): number {
    return Math.round((this.retries + this.maximum) * 100) / 100;
  }

  copy(): WarmupEntry {
    return new WarmupEntry(
      this.code,
      this.title,
      this.locale,
      this.externalRef,
      this.retries,
      this.durationMinutes,
      this.bid,
      this.maximum,
      this.campaignRef,
      this.ceiling,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a warmup entry in status proposed. */
export function newWarmupEntry(code: string, title: string): WarmupEntry {
  return new WarmupEntry(code, title, "", "", 0, 0, 0, 0, "", 0, false, "proposed");
}
