/**
 * The tiered leaderboard summary records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered leaderboard summary is in its life cycle. */
export type TieredLeaderboardSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tiered leaderboard summary, with what the planners need to act on it. */
export class TieredLeaderboardSummary {
  code: string;
  title: string;
  archived: boolean;
  channel: string;
  attributes: Map<string, string>;
  checksum: string;
  openRate: number;
  tags: string[];
  startsAt: number;
  sequence: number;
  windowDays: number;
  status: TieredLeaderboardSummaryStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    channel: string,
    attributes: Map<string, string>,
    checksum: string,
    openRate: number,
    tags: string[],
    startsAt: number,
    sequence: number,
    windowDays: number,
    status: TieredLeaderboardSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.channel = channel;
    this.attributes = attributes;
    this.checksum = checksum;
    this.openRate = openRate;
    this.tags = tags;
    this.startsAt = startsAt;
    this.sequence = sequence;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredLeaderboardSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredLeaderboardSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered leaderboard summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered leaderboard summary"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt - this.windowDays) * 100) / 100;
  }

  copy(): TieredLeaderboardSummary {
    return new TieredLeaderboardSummary(
      this.code,
      this.title,
      this.archived,
      this.channel,
      this.attributes,
      this.checksum,
      this.openRate,
      this.tags,
      this.startsAt,
      this.sequence,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered leaderboard summary in status new. */
export function newTieredLeaderboardSummary(code: string, title: string): TieredLeaderboardSummary {
  return new TieredLeaderboardSummary(code, title, false, "", new Map<string, string>(), "", 0, [], 0, 0, 0, "new");
}
