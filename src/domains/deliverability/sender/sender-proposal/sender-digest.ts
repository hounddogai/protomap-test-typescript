import * as text from "../../../../kit/text.js";

/** Where a sender digest is in its life cycle. */
export type SenderDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One sender digest, with what the planners need to act on it. */
export class SenderDigest {
  code: string;
  title: string;
  source: string;
  pinned: boolean;
  capacity: number;
  timezone: string;
  openRate: number;
  windowDays: number;
  status: SenderDigestStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    pinned: boolean,
    capacity: number,
    timezone: string,
    openRate: number,
    windowDays: number,
    status: SenderDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.pinned = pinned;
    this.capacity = capacity;
    this.timezone = timezone;
    this.openRate = openRate;
    this.windowDays = windowDays;
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

  canMoveTo(next: SenderDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
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

  moveTo(next: SenderDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sender digest"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.capacity + this.openRate) * 100) / 100;
  }

  copy(): SenderDigest {
    return new SenderDigest(
      this.code,
      this.title,
      this.source,
      this.pinned,
      this.capacity,
      this.timezone,
      this.openRate,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a sender digest in status draft. */
export function newSenderDigest(code: string, title: string): SenderDigest {
  return new SenderDigest(code, title, "", false, 0, "", 0, 0, "draft");
}
