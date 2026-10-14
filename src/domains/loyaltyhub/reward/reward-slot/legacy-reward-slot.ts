/**
 * The legacy reward slot records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy reward slot is in its life cycle. */
export type LegacyRewardSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy reward slot. Its code is unique within a tenant. */
export class LegacyRewardSlot {
  code: string;
  name: string;
  clicks: number;
  amount: number;
  currency: string;
  attributes: Map<string, string>;
  ratio: number;
  floorValue: number;
  channel: string;
  status: LegacyRewardSlotStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    amount: number,
    currency: string,
    attributes: Map<string, string>,
    ratio: number,
    floorValue: number,
    channel: string,
    status: LegacyRewardSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.amount = amount;
    this.currency = currency;
    this.attributes = attributes;
    this.ratio = ratio;
    this.floorValue = floorValue;
    this.channel = channel;
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

  canMoveTo(next: LegacyRewardSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyRewardSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reward slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round(this.clicks * this.amount * 100) / 100;
  }

  copy(): LegacyRewardSlot {
    return new LegacyRewardSlot(
      this.code,
      this.name,
      this.clicks,
      this.amount,
      this.currency,
      this.attributes,
      this.ratio,
      this.floorValue,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy reward slot in status planned. */
export function newLegacyRewardSlot(code: string, name: string): LegacyRewardSlot {
  return new LegacyRewardSlot(code, name, 0, 0, "", new Map<string, string>(), 0, 0, "", "planned");
}
