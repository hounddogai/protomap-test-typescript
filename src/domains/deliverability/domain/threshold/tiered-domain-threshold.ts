/**
 * The tiered domain threshold records of deliverability's domain work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered domain threshold is in its life cycle. */
export type TieredDomainThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered domain threshold as the domain team keeps it. */
export class TieredDomainThreshold {
  code: string;
  name: string;
  tags: string[];
  active: boolean;
  amount: number;
  clicks: number;
  channel: string;
  timezone: string;
  floorValue: number;
  impressions: number;
  status: TieredDomainThresholdStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    active: boolean,
    amount: number,
    clicks: number,
    channel: string,
    timezone: string,
    floorValue: number,
    impressions: number,
    status: TieredDomainThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.active = active;
    this.amount = amount;
    this.clicks = clicks;
    this.channel = channel;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.impressions = impressions;
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

  canMoveTo(next: TieredDomainThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredDomainThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered domain threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.clicks + this.impressions) * 100) / 100;
  }

  copy(): TieredDomainThreshold {
    return new TieredDomainThreshold(
      this.code,
      this.name,
      this.tags,
      this.active,
      this.amount,
      this.clicks,
      this.channel,
      this.timezone,
      this.floorValue,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered domain threshold in status idle. */
export function newTieredDomainThreshold(code: string, name: string): TieredDomainThreshold {
  return new TieredDomainThreshold(code, name, [], false, 0, 0, "", "", 0, 0, "idle");
}
