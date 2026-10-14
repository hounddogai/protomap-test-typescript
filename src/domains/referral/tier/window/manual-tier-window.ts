/**
 * The manual tier window records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual tier window is in its life cycle. */
export type ManualTierWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual tier window. Its code is unique within a tenant. */
export class ManualTierWindow {
  code: string;
  title: string;
  name: string;
  maximum: number;
  budget: number;
  quantity: number;
  impressions: number;
  source: string;
  channel: string;
  status: ManualTierWindowStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    maximum: number,
    budget: number,
    quantity: number,
    impressions: number,
    source: string,
    channel: string,
    status: ManualTierWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.maximum = maximum;
    this.budget = budget;
    this.quantity = quantity;
    this.impressions = impressions;
    this.source = source;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualTierWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualTierWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.impressions - this.budget) * 100) / 100;
  }

  copy(): ManualTierWindow {
    return new ManualTierWindow(
      this.code,
      this.title,
      this.name,
      this.maximum,
      this.budget,
      this.quantity,
      this.impressions,
      this.source,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual tier window in status proposed. */
export function newManualTierWindow(code: string, title: string): ManualTierWindow {
  return new ManualTierWindow(code, title, "", 0, 0, 0, 0, "", "", "proposed");
}
