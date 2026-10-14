import * as text from "../../../../kit/text.js";

/** Where a funnel tier is in its life cycle. */
export type FunnelTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One funnel tier, with what the planners need to act on it. */
export class FunnelTier {
  code: string;
  name: string;
  openRate: number;
  priority: number;
  audienceId: string;
  batchSize: number;
  channel: string;
  floorValue: number;
  ownerId: string;
  tags: string[];
  status: FunnelTierStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    priority: number,
    audienceId: string,
    batchSize: number,
    channel: string,
    floorValue: number,
    ownerId: string,
    tags: string[],
    status: FunnelTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.priority = priority;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.channel = channel;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
    this.tags = tags;
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

  canMoveTo(next: FunnelTierStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
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
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: FunnelTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"funnel tier"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.openRate * this.batchSize * 100) / 100;
  }

  copy(): FunnelTier {
    return new FunnelTier(
      this.code,
      this.name,
      this.openRate,
      this.priority,
      this.audienceId,
      this.batchSize,
      this.channel,
      this.floorValue,
      this.ownerId,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a funnel tier in status draft. */
export function newFunnelTier(code: string, name: string): FunnelTier {
  return new FunnelTier(code, name, 0, 0, "", 0, "", 0, "", [], "draft");
}
