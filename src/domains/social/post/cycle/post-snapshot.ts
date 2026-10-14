import * as text from "../../../../kit/text.js";

/** Where a post snapshot is in its life cycle. */
export type PostSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A post snapshot. Its code is unique within a tenant. */
export class PostSnapshot {
  code: string;
  title: string;
  variant: string;
  pinned: boolean;
  clicks: number;
  limit: number;
  channel: string;
  status: PostSnapshotStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    pinned: boolean,
    clicks: number,
    limit: number,
    channel: string,
    status: PostSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.pinned = pinned;
    this.clicks = clicks;
    this.limit = limit;
    this.channel = channel;
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

  canMoveTo(next: PostSnapshotStatus): boolean {
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
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PostSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netValue(): number {
    return Math.round(this.clicks * this.limit * 100) / 100;
  }

  copy(): PostSnapshot {
    return new PostSnapshot(
      this.code,
      this.title,
      this.variant,
      this.pinned,
      this.clicks,
      this.limit,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a post snapshot in status idle. */
export function newPostSnapshot(code: string, title: string): PostSnapshot {
  return new PostSnapshot(code, title, "", false, 0, 0, "", "idle");
}
