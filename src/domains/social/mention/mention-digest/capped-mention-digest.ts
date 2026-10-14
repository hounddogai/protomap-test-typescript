/**
 * The capped mention digest records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped mention digest is in its life cycle. */
export type CappedMentionDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a capped mention digest and its current status. */
export class CappedMentionDigest {
  code: string;
  label: string;
  maximum: number;
  campaignRef: string;
  unit: string;
  sendAt: number;
  tags: string[];
  amount: number;
  impressions: number;
  budget: number;
  status: CappedMentionDigestStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    campaignRef: string,
    unit: string,
    sendAt: number,
    tags: string[],
    amount: number,
    impressions: number,
    budget: number,
    status: CappedMentionDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.sendAt = sendAt;
    this.tags = tags;
    this.amount = amount;
    this.impressions = impressions;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedMentionDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedMentionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped mention digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round(this.impressions * this.budget * 100) / 100;
  }

  copy(): CappedMentionDigest {
    return new CappedMentionDigest(
      this.code,
      this.label,
      this.maximum,
      this.campaignRef,
      this.unit,
      this.sendAt,
      this.tags,
      this.amount,
      this.impressions,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped mention digest in status new. */
export function newCappedMentionDigest(code: string, label: string): CappedMentionDigest {
  return new CappedMentionDigest(code, label, 0, "", "", 0, [], 0, 0, 0, "new");
}
