import * as text from "../../../../kit/text.js";

/** Where a challenge slot is in its life cycle. */
export type ChallengeSlotStatus = "created" | "validated" | "published" | "retired";

/** One challenge slot, with what the planners need to act on it. */
export class ChallengeSlot {
  code: string;
  name: string;
  summary: string;
  unit: string;
  endsAt: number;
  createdAt: number;
  impressions: number;
  bid: number;
  tags: string[];
  region: string;
  channel: string;
  status: ChallengeSlotStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    unit: string,
    endsAt: number,
    createdAt: number,
    impressions: number,
    bid: number,
    tags: string[],
    region: string,
    channel: string,
    status: ChallengeSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.unit = unit;
    this.endsAt = endsAt;
    this.createdAt = createdAt;
    this.impressions = impressions;
    this.bid = bid;
    this.tags = tags;
    this.region = region;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeSlotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
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

  netValue(): number {
    return Math.round((this.bid - this.createdAt) * 100) / 100;
  }

  copy(): ChallengeSlot {
    return new ChallengeSlot(
      this.code,
      this.name,
      this.summary,
      this.unit,
      this.endsAt,
      this.createdAt,
      this.impressions,
      this.bid,
      this.tags,
      this.region,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a challenge slot in status created. */
export function newChallengeSlot(code: string, name: string): ChallengeSlot {
  return new ChallengeSlot(code, name, "", "", 0, 0, 0, 0, [], "", "", "created");
}
