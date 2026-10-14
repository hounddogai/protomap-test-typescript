import * as text from "../../../../kit/text.js";

/** Where a global touchpoint notice is in its life cycle. */
export type GlobalTouchpointNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One global touchpoint notice, with what the planners need to act on it. */
export class GlobalTouchpointNotice {
  code: string;
  title: string;
  threshold: number;
  category: string;
  updatedAt: number;
  channel: string;
  archived: boolean;
  impressions: number;
  status: GlobalTouchpointNoticeStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    category: string,
    updatedAt: number,
    channel: string,
    archived: boolean,
    impressions: number,
    status: GlobalTouchpointNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.category = category;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.archived = archived;
    this.impressions = impressions;
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

  canMoveTo(next: GlobalTouchpointNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
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
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalTouchpointNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global touchpoint notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.updatedAt * this.threshold * 100) / 100;
  }

  copy(): GlobalTouchpointNotice {
    return new GlobalTouchpointNotice(
      this.code,
      this.title,
      this.threshold,
      this.category,
      this.updatedAt,
      this.channel,
      this.archived,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global touchpoint notice in status draft. */
export function newGlobalTouchpointNotice(code: string, title: string): GlobalTouchpointNotice {
  return new GlobalTouchpointNotice(code, title, 0, "", 0, "", false, 0, "draft");
}
