/**
 * The regional tier manifest records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional tier manifest is in its life cycle. */
export type RegionalTierManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a regional tier manifest and its current status. */
export class RegionalTierManifest {
  code: string;
  label: string;
  limit: number;
  score: number;
  endsAt: number;
  channel: string;
  audienceId: string;
  createdAt: number;
  quantity: number;
  budget: number;
  amount: number;
  status: RegionalTierManifestStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    score: number,
    endsAt: number,
    channel: string,
    audienceId: string,
    createdAt: number,
    quantity: number,
    budget: number,
    amount: number,
    status: RegionalTierManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.score = score;
    this.endsAt = endsAt;
    this.channel = channel;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.budget = budget;
    this.amount = amount;
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

  canMoveTo(next: RegionalTierManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalTierManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional tier manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional tier manifest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.endsAt - this.amount) * 100) / 100;
  }

  copy(): RegionalTierManifest {
    return new RegionalTierManifest(
      this.code,
      this.label,
      this.limit,
      this.score,
      this.endsAt,
      this.channel,
      this.audienceId,
      this.createdAt,
      this.quantity,
      this.budget,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional tier manifest in status draft. */
export function newRegionalTierManifest(code: string, label: string): RegionalTierManifest {
  return new RegionalTierManifest(code, label, 0, 0, 0, "", "", 0, 0, 0, 0, "draft");
}
