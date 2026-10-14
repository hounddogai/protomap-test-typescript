import * as text from "../../../../kit/text.js";

/** Where a journey group is in its life cycle. */
export type JourneyGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A journey group. Its code is unique within a tenant. */
export class JourneyGroup {
  code: string;
  title: string;
  retries: number;
  pinned: boolean;
  rate: number;
  batchSize: number;
  score: number;
  channel: string;
  status: JourneyGroupStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    pinned: boolean,
    rate: number,
    batchSize: number,
    score: number,
    channel: string,
    status: JourneyGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.pinned = pinned;
    this.rate = rate;
    this.batchSize = batchSize;
    this.score = score;
    this.channel = channel;
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

  canMoveTo(next: JourneyGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.rate * this.batchSize * 100) / 100;
  }

  copy(): JourneyGroup {
    return new JourneyGroup(
      this.code,
      this.title,
      this.retries,
      this.pinned,
      this.rate,
      this.batchSize,
      this.score,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a journey group in status draft. */
export function newJourneyGroup(code: string, title: string): JourneyGroup {
  return new JourneyGroup(code, title, 0, false, 0, 0, 0, "", "draft");
}
