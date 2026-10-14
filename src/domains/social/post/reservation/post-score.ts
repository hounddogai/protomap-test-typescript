import * as text from "../../../../kit/text.js";

/** Where a post score is in its life cycle. */
export type PostScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One post score, with what the planners need to act on it. */
export class PostScore {
  code: string;
  title: string;
  discount: number;
  openRate: number;
  graceDays: number;
  startsAt: number;
  durationMinutes: number;
  version: number;
  score: number;
  status: PostScoreStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    openRate: number,
    graceDays: number,
    startsAt: number,
    durationMinutes: number,
    version: number,
    score: number,
    status: PostScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.version = version;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"post score"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.version + this.discount) * 100) / 100;
  }

  copy(): PostScore {
    return new PostScore(
      this.code,
      this.title,
      this.discount,
      this.openRate,
      this.graceDays,
      this.startsAt,
      this.durationMinutes,
      this.version,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a post score in status draft. */
export function newPostScore(code: string, title: string): PostScore {
  return new PostScore(code, title, 0, 0, 0, 0, 0, 0, 0, "draft");
}
