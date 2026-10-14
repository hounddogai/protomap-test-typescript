import * as text from "../../../../kit/text.js";

/** Where a legacy streak tier is in its life cycle. */
export type LegacyStreakTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a legacy streak tier and its current status. */
export class LegacyStreakTier {
  code: string;
  name: string;
  audienceId: string;
  endsAt: number;
  capacity: number;
  batchSize: number;
  externalRef: string;
  description: string;
  sendAt: number;
  status: LegacyStreakTierStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    endsAt: number,
    capacity: number,
    batchSize: number,
    externalRef: string,
    description: string,
    sendAt: number,
    status: LegacyStreakTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.capacity = capacity;
    this.batchSize = batchSize;
    this.externalRef = externalRef;
    this.description = description;
    this.sendAt = sendAt;
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

  canMoveTo(next: LegacyStreakTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyStreakTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy streak tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy streak tier"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.sendAt * this.capacity * 100) / 100;
  }

  copy(): LegacyStreakTier {
    return new LegacyStreakTier(
      this.code,
      this.name,
      this.audienceId,
      this.endsAt,
      this.capacity,
      this.batchSize,
      this.externalRef,
      this.description,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy streak tier in status idle. */
export function newLegacyStreakTier(code: string, name: string): LegacyStreakTier {
  return new LegacyStreakTier(code, name, "", 0, 0, 0, "", "", 0, "idle");
}
