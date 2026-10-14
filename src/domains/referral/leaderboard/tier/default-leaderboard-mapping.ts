import * as text from "../../../../kit/text.js";

/** Where a default leaderboard mapping is in its life cycle. */
export type DefaultLeaderboardMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A default leaderboard mapping. Its code is unique within a tenant. */
export class DefaultLeaderboardMapping {
  code: string;
  name: string;
  sequence: number;
  summary: string;
  attributes: Map<string, string>;
  amount: number;
  region: string;
  threshold: number;
  endsAt: number;
  channel: string;
  unit: string;
  status: DefaultLeaderboardMappingStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    summary: string,
    attributes: Map<string, string>,
    amount: number,
    region: string,
    threshold: number,
    endsAt: number,
    channel: string,
    unit: string,
    status: DefaultLeaderboardMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.summary = summary;
    this.attributes = attributes;
    this.amount = amount;
    this.region = region;
    this.threshold = threshold;
    this.endsAt = endsAt;
    this.channel = channel;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultLeaderboardMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultLeaderboardMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default leaderboard mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default leaderboard mapping"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.endsAt - this.amount) * 100) / 100;
  }

  copy(): DefaultLeaderboardMapping {
    return new DefaultLeaderboardMapping(
      this.code,
      this.name,
      this.sequence,
      this.summary,
      this.attributes,
      this.amount,
      this.region,
      this.threshold,
      this.endsAt,
      this.channel,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a default leaderboard mapping in status requested. */
export function newDefaultLeaderboardMapping(code: string, name: string): DefaultLeaderboardMapping {
  return new DefaultLeaderboardMapping(code, name, 0, "", new Map<string, string>(), 0, "", 0, 0, "", "", "requested");
}
