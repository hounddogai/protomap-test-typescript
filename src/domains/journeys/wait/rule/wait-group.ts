import * as text from "../../../../kit/text.js";

/** Where a wait group is in its life cycle. */
export type WaitGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One wait group, with what the planners need to act on it. */
export class WaitGroup {
  code: string;
  title: string;
  label: string;
  score: number;
  attempts: number;
  bid: number;
  clicks: number;
  status: WaitGroupStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    score: number,
    attempts: number,
    bid: number,
    clicks: number,
    status: WaitGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.score = score;
    this.attempts = attempts;
    this.bid = bid;
    this.clicks = clicks;
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

  canMoveTo(next: WaitGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"wait group"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.clicks - this.attempts) * 100) / 100;
  }

  copy(): WaitGroup {
    return new WaitGroup(
      this.code,
      this.title,
      this.label,
      this.score,
      this.attempts,
      this.bid,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait group in status draft. */
export function newWaitGroup(code: string, title: string): WaitGroup {
  return new WaitGroup(code, title, "", 0, 0, 0, 0, "draft");
}
