import * as text from "../../../../kit/text.js";

/** Where a legacy level notice is in its life cycle. */
export type LegacyLevelNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy level notice as the level team keeps it. */
export class LegacyLevelNotice {
  code: string;
  title: string;
  capacity: number;
  endsAt: number;
  pinned: boolean;
  ownerId: string;
  score: number;
  maximum: number;
  revision: number;
  budget: number;
  status: LegacyLevelNoticeStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    endsAt: number,
    pinned: boolean,
    ownerId: string,
    score: number,
    maximum: number,
    revision: number,
    budget: number,
    status: LegacyLevelNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.endsAt = endsAt;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.score = score;
    this.maximum = maximum;
    this.revision = revision;
    this.budget = budget;
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

  canMoveTo(next: LegacyLevelNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyLevelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy level notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.maximum - this.score) * 100) / 100;
  }

  copy(): LegacyLevelNotice {
    return new LegacyLevelNotice(
      this.code,
      this.title,
      this.capacity,
      this.endsAt,
      this.pinned,
      this.ownerId,
      this.score,
      this.maximum,
      this.revision,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy level notice in status idle. */
export function newLegacyLevelNotice(code: string, title: string): LegacyLevelNotice {
  return new LegacyLevelNotice(code, title, 0, 0, false, "", 0, 0, 0, 0, "idle");
}
