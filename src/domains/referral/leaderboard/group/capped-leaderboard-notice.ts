import * as text from "../../../../kit/text.js";

/** Where a capped leaderboard notice is in its life cycle. */
export type CappedLeaderboardNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped leaderboard notice. Its code is unique within a tenant. */
export class CappedLeaderboardNotice {
  code: string;
  label: string;
  channel: string;
  utmSource: string;
  threshold: number;
  sendAt: number;
  budget: number;
  version: number;
  visible: boolean;
  checksum: string;
  unit: string;
  status: CappedLeaderboardNoticeStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    utmSource: string,
    threshold: number,
    sendAt: number,
    budget: number,
    version: number,
    visible: boolean,
    checksum: string,
    unit: string,
    status: CappedLeaderboardNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.utmSource = utmSource;
    this.threshold = threshold;
    this.sendAt = sendAt;
    this.budget = budget;
    this.version = version;
    this.visible = visible;
    this.checksum = checksum;
    this.unit = unit;
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

  canMoveTo(next: CappedLeaderboardNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedLeaderboardNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped leaderboard notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.sendAt - this.budget) * 100) / 100;
  }

  copy(): CappedLeaderboardNotice {
    return new CappedLeaderboardNotice(
      this.code,
      this.label,
      this.channel,
      this.utmSource,
      this.threshold,
      this.sendAt,
      this.budget,
      this.version,
      this.visible,
      this.checksum,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped leaderboard notice in status idle. */
export function newCappedLeaderboardNotice(code: string, label: string): CappedLeaderboardNotice {
  return new CappedLeaderboardNotice(code, label, "", "", 0, 0, 0, 0, false, "", "", "idle");
}
