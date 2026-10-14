/**
 * The legacy subscription slot records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy subscription slot is in its life cycle. */
export type LegacySubscriptionSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One legacy subscription slot, with what the planners need to act on it. */
export class LegacySubscriptionSlot {
  code: string;
  label: string;
  tags: string[];
  campaignRef: string;
  updatedAt: number;
  source: string;
  visible: boolean;
  maximum: number;
  budget: number;
  status: LegacySubscriptionSlotStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    campaignRef: string,
    updatedAt: number,
    source: string,
    visible: boolean,
    maximum: number,
    budget: number,
    status: LegacySubscriptionSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.campaignRef = campaignRef;
    this.updatedAt = updatedAt;
    this.source = source;
    this.visible = visible;
    this.maximum = maximum;
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

  canMoveTo(next: LegacySubscriptionSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
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

  moveTo(next: LegacySubscriptionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy subscription slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.maximum * this.updatedAt * 100) / 100;
  }

  copy(): LegacySubscriptionSlot {
    return new LegacySubscriptionSlot(
      this.code,
      this.label,
      this.tags,
      this.campaignRef,
      this.updatedAt,
      this.source,
      this.visible,
      this.maximum,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy subscription slot in status idle. */
export function newLegacySubscriptionSlot(code: string, label: string): LegacySubscriptionSlot {
  return new LegacySubscriptionSlot(code, label, [], "", 0, "", false, 0, 0, "idle");
}
