import * as text from "../../../../kit/text.js";

/** Where a subscription notice is in its life cycle. */
export type SubscriptionNoticeStatus = "created" | "validated" | "published" | "retired";

/** One subscription notice, with what the planners need to act on it. */
export class SubscriptionNotice {
  code: string;
  title: string;
  pinned: boolean;
  locale: string;
  sequence: number;
  capacity: number;
  revision: number;
  region: string;
  status: SubscriptionNoticeStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    locale: string,
    sequence: number,
    capacity: number,
    revision: number,
    region: string,
    status: SubscriptionNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.locale = locale;
    this.sequence = sequence;
    this.capacity = capacity;
    this.revision = revision;
    this.region = region;
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

  canMoveTo(next: SubscriptionNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round((this.revision - this.sequence) * 100) / 100;
  }

  copy(): SubscriptionNotice {
    return new SubscriptionNotice(
      this.code,
      this.title,
      this.pinned,
      this.locale,
      this.sequence,
      this.capacity,
      this.revision,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a subscription notice in status created. */
export function newSubscriptionNotice(code: string, title: string): SubscriptionNotice {
  return new SubscriptionNotice(code, title, false, "", 0, 0, 0, "", "created");
}
