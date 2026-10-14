import * as text from "../../../../kit/text.js";

/** Where a tiered reward checkpoint is in its life cycle. */
export type TieredRewardCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered reward checkpoint. Its code is unique within a tenant. */
export class TieredRewardCheckpoint {
  code: string;
  name: string;
  region: string;
  maximum: number;
  threshold: number;
  discount: number;
  priority: number;
  campaignRef: string;
  journeyId: string;
  bid: number;
  tags: string[];
  status: TieredRewardCheckpointStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    maximum: number,
    threshold: number,
    discount: number,
    priority: number,
    campaignRef: string,
    journeyId: string,
    bid: number,
    tags: string[],
    status: TieredRewardCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.maximum = maximum;
    this.threshold = threshold;
    this.discount = discount;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.bid = bid;
    this.tags = tags;
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

  canMoveTo(next: TieredRewardCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
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

  moveTo(next: TieredRewardCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round(this.priority * this.bid * 100) / 100;
  }

  copy(): TieredRewardCheckpoint {
    return new TieredRewardCheckpoint(
      this.code,
      this.name,
      this.region,
      this.maximum,
      this.threshold,
      this.discount,
      this.priority,
      this.campaignRef,
      this.journeyId,
      this.bid,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered reward checkpoint in status idle. */
export function newTieredRewardCheckpoint(code: string, name: string): TieredRewardCheckpoint {
  return new TieredRewardCheckpoint(code, name, "", 0, 0, 0, 0, "", "", 0, [], "idle");
}
