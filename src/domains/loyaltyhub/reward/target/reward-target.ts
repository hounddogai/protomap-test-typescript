/**
 * The reward target records of loyaltyhub's reward work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward target is in its life cycle. */
export type RewardTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reward target. Its code is unique within a tenant. */
export class RewardTarget {
  code: string;
  label: string;
  region: string;
  sendAt: number;
  notes: string;
  openRate: number;
  ceiling: number;
  campaignRef: string;
  channel: string;
  quantity: number;
  name: string;
  status: RewardTargetStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    sendAt: number,
    notes: string,
    openRate: number,
    ceiling: number,
    campaignRef: string,
    channel: string,
    quantity: number,
    name: string,
    status: RewardTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.sendAt = sendAt;
    this.notes = notes;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.quantity = quantity;
    this.name = name;
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

  canMoveTo(next: RewardTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.quantity + this.sendAt) * 100) / 100;
  }

  copy(): RewardTarget {
    return new RewardTarget(
      this.code,
      this.label,
      this.region,
      this.sendAt,
      this.notes,
      this.openRate,
      this.ceiling,
      this.campaignRef,
      this.channel,
      this.quantity,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reward target in status draft. */
export function newRewardTarget(code: string, label: string): RewardTarget {
  return new RewardTarget(code, label, "", 0, "", 0, 0, "", "", 0, "", "draft");
}
