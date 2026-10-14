import * as text from "../../../../kit/text.js";

/** Where a streak snapshot is in its life cycle. */
export type StreakSnapshotStatus = "created" | "validated" | "published" | "retired";

/** One streak snapshot, with what the planners need to act on it. */
export class StreakSnapshot {
  code: string;
  title: string;
  ceiling: number;
  tags: string[];
  bid: number;
  channel: string;
  journeyId: string;
  status: StreakSnapshotStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    tags: string[],
    bid: number,
    channel: string,
    journeyId: string,
    status: StreakSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.tags = tags;
    this.bid = bid;
    this.channel = channel;
    this.journeyId = journeyId;
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

  canMoveTo(next: StreakSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StreakSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.ceiling + this.bid) * 100) / 100;
  }

  copy(): StreakSnapshot {
    return new StreakSnapshot(
      this.code,
      this.title,
      this.ceiling,
      this.tags,
      this.bid,
      this.channel,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a streak snapshot in status created. */
export function newStreakSnapshot(code: string, title: string): StreakSnapshot {
  return new StreakSnapshot(code, title, 0, [], 0, "", "", "created");
}
