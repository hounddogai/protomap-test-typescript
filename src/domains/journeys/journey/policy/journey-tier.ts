import * as text from "../../../../kit/text.js";

/** Where a journey tier is in its life cycle. */
export type JourneyTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A journey tier. Its code is unique within a tenant. */
export class JourneyTier {
  code: string;
  name: string;
  score: number;
  conversionRate: number;
  tags: string[];
  approved: boolean;
  checksum: string;
  windowDays: number;
  channel: string;
  status: JourneyTierStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    conversionRate: number,
    tags: string[],
    approved: boolean,
    checksum: string,
    windowDays: number,
    channel: string,
    status: JourneyTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.conversionRate = conversionRate;
    this.tags = tags;
    this.approved = approved;
    this.checksum = checksum;
    this.windowDays = windowDays;
    this.channel = channel;
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

  canMoveTo(next: JourneyTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: JourneyTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.score - this.windowDays) * 100) / 100;
  }

  copy(): JourneyTier {
    return new JourneyTier(
      this.code,
      this.name,
      this.score,
      this.conversionRate,
      this.tags,
      this.approved,
      this.checksum,
      this.windowDays,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a journey tier in status idle. */
export function newJourneyTier(code: string, name: string): JourneyTier {
  return new JourneyTier(code, name, 0, 0, [], false, "", 0, "", "idle");
}
