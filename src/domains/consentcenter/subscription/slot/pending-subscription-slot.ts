/**
 * The pending subscription slot records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending subscription slot is in its life cycle. */
export type PendingSubscriptionSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending subscription slot. Its code is unique within a tenant. */
export class PendingSubscriptionSlot {
  code: string;
  title: string;
  unit: string;
  region: string;
  campaignRef: string;
  country: string;
  minimum: number;
  capacity: number;
  limit: number;
  status: PendingSubscriptionSlotStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    region: string,
    campaignRef: string,
    country: string,
    minimum: number,
    capacity: number,
    limit: number,
    status: PendingSubscriptionSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.region = region;
    this.campaignRef = campaignRef;
    this.country = country;
    this.minimum = minimum;
    this.capacity = capacity;
    this.limit = limit;
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

  canMoveTo(next: PendingSubscriptionSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingSubscriptionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending subscription slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending subscription slot"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.minimum - this.limit) * 100) / 100;
  }

  copy(): PendingSubscriptionSlot {
    return new PendingSubscriptionSlot(
      this.code,
      this.title,
      this.unit,
      this.region,
      this.campaignRef,
      this.country,
      this.minimum,
      this.capacity,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending subscription slot in status idle. */
export function newPendingSubscriptionSlot(code: string, title: string): PendingSubscriptionSlot {
  return new PendingSubscriptionSlot(code, title, "", "", "", "", 0, 0, 0, "idle");
}
