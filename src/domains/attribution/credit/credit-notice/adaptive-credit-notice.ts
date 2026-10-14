/**
 * The adaptive credit notice records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive credit notice is in its life cycle. */
export type AdaptiveCreditNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a adaptive credit notice and its current status. */
export class AdaptiveCreditNotice {
  code: string;
  title: string;
  discount: number;
  externalRef: string;
  checksum: string;
  source: string;
  phone: string;
  summary: string;
  rate: number;
  budget: number;
  status: AdaptiveCreditNoticeStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    externalRef: string,
    checksum: string,
    source: string,
    phone: string,
    summary: string,
    rate: number,
    budget: number,
    status: AdaptiveCreditNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.externalRef = externalRef;
    this.checksum = checksum;
    this.source = source;
    this.phone = phone;
    this.summary = summary;
    this.rate = rate;
    this.budget = budget;
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

  canMoveTo(next: AdaptiveCreditNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveCreditNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive credit notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.budget + this.rate) * 100) / 100;
  }

  copy(): AdaptiveCreditNotice {
    return new AdaptiveCreditNotice(
      this.code,
      this.title,
      this.discount,
      this.externalRef,
      this.checksum,
      this.source,
      this.phone,
      this.summary,
      this.rate,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive credit notice in status idle. */
export function newAdaptiveCreditNotice(code: string, title: string): AdaptiveCreditNotice {
  return new AdaptiveCreditNotice(code, title, 0, "", "", "", "", "", 0, 0, "idle");
}
