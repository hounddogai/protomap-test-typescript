import * as text from "../../../../kit/text.js";

/** Where a strict touchpoint notice is in its life cycle. */
export type StrictTouchpointNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict touchpoint notice, with what the planners need to act on it. */
export class StrictTouchpointNotice {
  code: string;
  label: string;
  summary: string;
  sendAt: number;
  endsAt: number;
  createdAt: number;
  expiresAt: number;
  clicks: number;
  quantity: number;
  status: StrictTouchpointNoticeStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    sendAt: number,
    endsAt: number,
    createdAt: number,
    expiresAt: number,
    clicks: number,
    quantity: number,
    status: StrictTouchpointNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictTouchpointNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictTouchpointNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict touchpoint notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict touchpoint notice"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.expiresAt * this.createdAt * 100) / 100;
  }

  copy(): StrictTouchpointNotice {
    return new StrictTouchpointNotice(
      this.code,
      this.label,
      this.summary,
      this.sendAt,
      this.endsAt,
      this.createdAt,
      this.expiresAt,
      this.clicks,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict touchpoint notice in status open. */
export function newStrictTouchpointNotice(code: string, label: string): StrictTouchpointNotice {
  return new StrictTouchpointNotice(code, label, "", 0, 0, 0, 0, 0, 0, "open");
}
