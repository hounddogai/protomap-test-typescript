/**
 * The tier notice records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier notice is in its life cycle. */
export type TierNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tier notice and its current status. */
export class TierNotice {
  code: string;
  label: string;
  cost: number;
  checksum: string;
  maximum: number;
  channel: string;
  limit: number;
  openRate: number;
  status: TierNoticeStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    checksum: string,
    maximum: number,
    channel: string,
    limit: number,
    openRate: number,
    status: TierNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.checksum = checksum;
    this.maximum = maximum;
    this.channel = channel;
    this.limit = limit;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.openRate + this.cost) * 100) / 100;
  }

  copy(): TierNotice {
    return new TierNotice(
      this.code,
      this.label,
      this.cost,
      this.checksum,
      this.maximum,
      this.channel,
      this.limit,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tier notice in status idle. */
export function newTierNotice(code: string, label: string): TierNotice {
  return new TierNotice(code, label, 0, "", 0, "", 0, 0, "idle");
}
