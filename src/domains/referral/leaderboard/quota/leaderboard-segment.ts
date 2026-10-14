import * as text from "../../../../kit/text.js";

/** Where a leaderboard segment is in its life cycle. */
export type LeaderboardSegmentStatus = "created" | "validated" | "published" | "retired";

/** A leaderboard segment as the leaderboard team keeps it. */
export class LeaderboardSegment {
  code: string;
  title: string;
  durationMinutes: number;
  conversionRate: number;
  discount: number;
  attempts: number;
  quantity: number;
  archived: boolean;
  channel: string;
  category: string;
  amount: number;
  status: LeaderboardSegmentStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    conversionRate: number,
    discount: number,
    attempts: number,
    quantity: number,
    archived: boolean,
    channel: string,
    category: string,
    amount: number,
    status: LeaderboardSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.attempts = attempts;
    this.quantity = quantity;
    this.archived = archived;
    this.channel = channel;
    this.category = category;
    this.amount = amount;
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

  canMoveTo(next: LeaderboardSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LeaderboardSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netTotal(): number {
    return Math.round((this.quantity - this.attempts) * 100) / 100;
  }

  copy(): LeaderboardSegment {
    return new LeaderboardSegment(
      this.code,
      this.title,
      this.durationMinutes,
      this.conversionRate,
      this.discount,
      this.attempts,
      this.quantity,
      this.archived,
      this.channel,
      this.category,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a leaderboard segment in status created. */
export function newLeaderboardSegment(code: string, title: string): LeaderboardSegment {
  return new LeaderboardSegment(code, title, 0, 0, 0, 0, 0, false, "", "", 0, "created");
}
