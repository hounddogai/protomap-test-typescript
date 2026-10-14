import * as text from "../../../../kit/text.js";

/** Where a tiered path digest is in its life cycle. */
export type TieredPathDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered path digest as the path team keeps it. */
export class TieredPathDigest {
  code: string;
  name: string;
  score: number;
  reviewer: string;
  channel: string;
  campaignRef: string;
  cohort: string;
  revision: number;
  createdAt: number;
  discount: number;
  expiresAt: number;
  status: TieredPathDigestStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    reviewer: string,
    channel: string,
    campaignRef: string,
    cohort: string,
    revision: number,
    createdAt: number,
    discount: number,
    expiresAt: number,
    status: TieredPathDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.reviewer = reviewer;
    this.channel = channel;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.revision = revision;
    this.createdAt = createdAt;
    this.discount = discount;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: TieredPathDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredPathDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered path digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.revision + this.createdAt) * 100) / 100;
  }

  copy(): TieredPathDigest {
    return new TieredPathDigest(
      this.code,
      this.name,
      this.score,
      this.reviewer,
      this.channel,
      this.campaignRef,
      this.cohort,
      this.revision,
      this.createdAt,
      this.discount,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered path digest in status idle. */
export function newTieredPathDigest(code: string, name: string): TieredPathDigest {
  return new TieredPathDigest(code, name, 0, "", "", "", "", 0, 0, 0, 0, "idle");
}
