import * as text from "../../../../kit/text.js";

/** Where a seasonal wait tier is in its life cycle. */
export type SeasonalWaitTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal wait tier, with what the planners need to act on it. */
export class SeasonalWaitTier {
  code: string;
  name: string;
  retries: number;
  pinned: boolean;
  rate: number;
  channel: string;
  unit: string;
  checksum: string;
  createdAt: number;
  capacity: number;
  frequencyCap: number;
  status: SeasonalWaitTierStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    pinned: boolean,
    rate: number,
    channel: string,
    unit: string,
    checksum: string,
    createdAt: number,
    capacity: number,
    frequencyCap: number,
    status: SeasonalWaitTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.pinned = pinned;
    this.rate = rate;
    this.channel = channel;
    this.unit = unit;
    this.checksum = checksum;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: SeasonalWaitTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
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

  moveTo(next: SeasonalWaitTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal wait tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.rate - this.capacity) * 100) / 100;
  }

  copy(): SeasonalWaitTier {
    return new SeasonalWaitTier(
      this.code,
      this.name,
      this.retries,
      this.pinned,
      this.rate,
      this.channel,
      this.unit,
      this.checksum,
      this.createdAt,
      this.capacity,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal wait tier in status draft. */
export function newSeasonalWaitTier(code: string, name: string): SeasonalWaitTier {
  return new SeasonalWaitTier(code, name, 0, false, 0, "", "", "", 0, 0, 0, "draft");
}
