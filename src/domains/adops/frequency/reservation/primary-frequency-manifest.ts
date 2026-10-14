import * as text from "../../../../kit/text.js";

/** Where a primary frequency manifest is in its life cycle. */
export type PrimaryFrequencyManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary frequency manifest as the frequency team keeps it. */
export class PrimaryFrequencyManifest {
  code: string;
  title: string;
  pinned: boolean;
  approved: boolean;
  threshold: number;
  amount: number;
  maximum: number;
  campaignRef: string;
  category: string;
  status: PrimaryFrequencyManifestStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    approved: boolean,
    threshold: number,
    amount: number,
    maximum: number,
    campaignRef: string,
    category: string,
    status: PrimaryFrequencyManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.approved = approved;
    this.threshold = threshold;
    this.amount = amount;
    this.maximum = maximum;
    this.campaignRef = campaignRef;
    this.category = category;
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

  canMoveTo(next: PrimaryFrequencyManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryFrequencyManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary frequency manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedTotal(): number {
    return Math.round((this.maximum + this.threshold) * 100) / 100;
  }

  copy(): PrimaryFrequencyManifest {
    return new PrimaryFrequencyManifest(
      this.code,
      this.title,
      this.pinned,
      this.approved,
      this.threshold,
      this.amount,
      this.maximum,
      this.campaignRef,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary frequency manifest in status idle. */
export function newPrimaryFrequencyManifest(code: string, title: string): PrimaryFrequencyManifest {
  return new PrimaryFrequencyManifest(code, title, false, false, 0, 0, 0, "", "", "idle");
}
