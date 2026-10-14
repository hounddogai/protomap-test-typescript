import * as text from "../../../../kit/text.js";

/** Where a rolling flight score is in its life cycle. */
export type RollingFlightScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling flight score as the flight team keeps it. */
export class RollingFlightScore {
  code: string;
  label: string;
  checksum: string;
  ceiling: number;
  region: string;
  discount: number;
  endsAt: number;
  sequence: number;
  floorValue: number;
  ownerId: string;
  tags: string[];
  status: RollingFlightScoreStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    ceiling: number,
    region: string,
    discount: number,
    endsAt: number,
    sequence: number,
    floorValue: number,
    ownerId: string,
    tags: string[],
    status: RollingFlightScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.ceiling = ceiling;
    this.region = region;
    this.discount = discount;
    this.endsAt = endsAt;
    this.sequence = sequence;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
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

  canMoveTo(next: RollingFlightScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
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

  moveTo(next: RollingFlightScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling flight score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"rolling flight score"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.endsAt + this.ceiling) * 100) / 100;
  }

  copy(): RollingFlightScore {
    return new RollingFlightScore(
      this.code,
      this.label,
      this.checksum,
      this.ceiling,
      this.region,
      this.discount,
      this.endsAt,
      this.sequence,
      this.floorValue,
      this.ownerId,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling flight score in status idle. */
export function newRollingFlightScore(code: string, label: string): RollingFlightScore {
  return new RollingFlightScore(code, label, "", 0, "", 0, 0, 0, 0, "", [], "idle");
}
