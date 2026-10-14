import * as text from "../../../../kit/text.js";

/** Where a post cycle is in its life cycle. */
export type PostCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A post cycle as the post team keeps it. */
export class PostCycle {
  code: string;
  title: string;
  rate: number;
  version: number;
  clicks: number;
  durationMinutes: number;
  expiresAt: number;
  score: number;
  channel: string;
  name: string;
  status: PostCycleStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    version: number,
    clicks: number,
    durationMinutes: number,
    expiresAt: number,
    score: number,
    channel: string,
    name: string,
    status: PostCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.version = version;
    this.clicks = clicks;
    this.durationMinutes = durationMinutes;
    this.expiresAt = expiresAt;
    this.score = score;
    this.channel = channel;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round(this.score * this.version * 100) / 100;
  }

  copy(): PostCycle {
    return new PostCycle(
      this.code,
      this.title,
      this.rate,
      this.version,
      this.clicks,
      this.durationMinutes,
      this.expiresAt,
      this.score,
      this.channel,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a post cycle in status planned. */
export function newPostCycle(code: string, title: string): PostCycle {
  return new PostCycle(code, title, 0, 0, 0, 0, 0, 0, "", "", "planned");
}
