/**
 * The reward slot records of loyaltyhub's reward work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward slot is in its life cycle. */
export type RewardSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reward slot, with what the planners need to act on it. */
export class RewardSlot {
  code: string;
  name: string;
  updatedAt: number;
  durationMinutes: number;
  pinned: boolean;
  description: string;
  campaignRef: string;
  contactEmail: string;
  ratio: number;
  active: boolean;
  status: RewardSlotStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    durationMinutes: number,
    pinned: boolean,
    description: string,
    campaignRef: string,
    contactEmail: string,
    ratio: number,
    active: boolean,
    status: RewardSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.durationMinutes = durationMinutes;
    this.pinned = pinned;
    this.description = description;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.active = active;
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

  canMoveTo(next: RewardSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RewardSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.updatedAt - this.ratio) * 100) / 100;
  }

  copy(): RewardSlot {
    return new RewardSlot(
      this.code,
      this.name,
      this.updatedAt,
      this.durationMinutes,
      this.pinned,
      this.description,
      this.campaignRef,
      this.contactEmail,
      this.ratio,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward slot in status proposed. */
export function newRewardSlot(code: string, name: string): RewardSlot {
  return new RewardSlot(code, name, 0, 0, false, "", "", "", 0, false, "proposed");
}
