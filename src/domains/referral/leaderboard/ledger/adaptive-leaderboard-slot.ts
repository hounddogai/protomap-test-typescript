import * as text from "../../../../kit/text.js";

/** Where a adaptive leaderboard slot is in its life cycle. */
export type AdaptiveLeaderboardSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive leaderboard slot and its current status. */
export class AdaptiveLeaderboardSlot {
  code: string;
  title: string;
  channel: string;
  priority: number;
  clicks: number;
  status: AdaptiveLeaderboardSlotStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    priority: number,
    clicks: number,
    status: AdaptiveLeaderboardSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.priority = priority;
    this.clicks = clicks;
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

  canMoveTo(next: AdaptiveLeaderboardSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: AdaptiveLeaderboardSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive leaderboard slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive leaderboard slot"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.priority * this.clicks * 100) / 100;
  }

  copy(): AdaptiveLeaderboardSlot {
    return new AdaptiveLeaderboardSlot(this.code, this.title, this.channel, this.priority, this.clicks, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive leaderboard slot in status requested. */
export function newAdaptiveLeaderboardSlot(code: string, title: string): AdaptiveLeaderboardSlot {
  return new AdaptiveLeaderboardSlot(code, title, "", 0, 0, "requested");
}
