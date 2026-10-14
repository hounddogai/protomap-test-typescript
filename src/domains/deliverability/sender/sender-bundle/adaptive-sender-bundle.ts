/**
 * The adaptive sender bundle records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive sender bundle is in its life cycle. */
export type AdaptiveSenderBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive sender bundle. Its code is unique within a tenant. */
export class AdaptiveSenderBundle {
  code: string;
  label: string;
  channel: string;
  quantity: number;
  campaignRef: string;
  capacity: number;
  discount: number;
  locale: string;
  attempts: number;
  status: AdaptiveSenderBundleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    quantity: number,
    campaignRef: string,
    capacity: number,
    discount: number,
    locale: string,
    attempts: number,
    status: AdaptiveSenderBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.discount = discount;
    this.locale = locale;
    this.attempts = attempts;
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

  canMoveTo(next: AdaptiveSenderBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSenderBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive sender bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.capacity + this.attempts) * 100) / 100;
  }

  copy(): AdaptiveSenderBundle {
    return new AdaptiveSenderBundle(
      this.code,
      this.label,
      this.channel,
      this.quantity,
      this.campaignRef,
      this.capacity,
      this.discount,
      this.locale,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive sender bundle in status new. */
export function newAdaptiveSenderBundle(code: string, label: string): AdaptiveSenderBundle {
  return new AdaptiveSenderBundle(code, label, "", 0, "", 0, 0, "", 0, "new");
}
