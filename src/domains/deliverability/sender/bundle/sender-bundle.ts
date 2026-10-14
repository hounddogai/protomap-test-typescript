/**
 * The sender bundle records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender bundle is in its life cycle. */
export type SenderBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a sender bundle and its current status. */
export class SenderBundle {
  code: string;
  label: string;
  ceiling: number;
  budget: number;
  sendAt: number;
  conversionRate: number;
  region: string;
  endsAt: number;
  checksum: string;
  status: SenderBundleStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    budget: number,
    sendAt: number,
    conversionRate: number,
    region: string,
    endsAt: number,
    checksum: string,
    status: SenderBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.budget = budget;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.region = region;
    this.endsAt = endsAt;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.ceiling - this.sendAt) * 100) / 100;
  }

  copy(): SenderBundle {
    return new SenderBundle(
      this.code,
      this.label,
      this.ceiling,
      this.budget,
      this.sendAt,
      this.conversionRate,
      this.region,
      this.endsAt,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a sender bundle in status requested. */
export function newSenderBundle(code: string, label: string): SenderBundle {
  return new SenderBundle(code, label, 0, 0, 0, 0, "", 0, "", "requested");
}
