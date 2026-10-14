/**
 * The conversion slot records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion slot is in its life cycle. */
export type ConversionSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A conversion slot. Its code is unique within a tenant. */
export class ConversionSlot {
  code: string;
  title: string;
  reviewer: string;
  version: number;
  clicks: number;
  channel: string;
  sendAt: number;
  country: string;
  updatedAt: number;
  region: string;
  status: ConversionSlotStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    version: number,
    clicks: number,
    channel: string,
    sendAt: number,
    country: string,
    updatedAt: number,
    region: string,
    status: ConversionSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.version = version;
    this.clicks = clicks;
    this.channel = channel;
    this.sendAt = sendAt;
    this.country = country;
    this.updatedAt = updatedAt;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ConversionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.version - this.clicks) * 100) / 100;
  }

  copy(): ConversionSlot {
    return new ConversionSlot(
      this.code,
      this.title,
      this.reviewer,
      this.version,
      this.clicks,
      this.channel,
      this.sendAt,
      this.country,
      this.updatedAt,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a conversion slot in status planned. */
export function newConversionSlot(code: string, title: string): ConversionSlot {
  return new ConversionSlot(code, title, "", 0, 0, "", 0, "", 0, "", "planned");
}
