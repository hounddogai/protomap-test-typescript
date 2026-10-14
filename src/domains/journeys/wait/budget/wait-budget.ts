/**
 * The wait budget records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait budget is in its life cycle. */
export type WaitBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A wait budget as the wait team keeps it. */
export class WaitBudget {
  code: string;
  label: string;
  impressions: number;
  maximum: number;
  channel: string;
  category: string;
  floorValue: number;
  pinned: boolean;
  createdAt: number;
  capacity: number;
  conversionRate: number;
  status: WaitBudgetStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    maximum: number,
    channel: string,
    category: string,
    floorValue: number,
    pinned: boolean,
    createdAt: number,
    capacity: number,
    conversionRate: number,
    status: WaitBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.maximum = maximum;
    this.channel = channel;
    this.category = category;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WaitBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"wait budget"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.maximum * this.impressions * 100) / 100;
  }

  copy(): WaitBudget {
    return new WaitBudget(
      this.code,
      this.label,
      this.impressions,
      this.maximum,
      this.channel,
      this.category,
      this.floorValue,
      this.pinned,
      this.createdAt,
      this.capacity,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a wait budget in status draft. */
export function newWaitBudget(code: string, label: string): WaitBudget {
  return new WaitBudget(code, label, 0, 0, "", "", 0, false, 0, 0, 0, "draft");
}
