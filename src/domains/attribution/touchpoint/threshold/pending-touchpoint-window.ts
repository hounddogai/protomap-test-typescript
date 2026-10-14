import * as text from "../../../../kit/text.js";

/** Where a pending touchpoint window is in its life cycle. */
export type PendingTouchpointWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending touchpoint window as the touchpoint team keeps it. */
export class PendingTouchpointWindow {
  code: string;
  title: string;
  phone: string;
  impressions: number;
  bid: number;
  audienceId: string;
  status: PendingTouchpointWindowStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    impressions: number,
    bid: number,
    audienceId: string,
    status: PendingTouchpointWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.impressions = impressions;
    this.bid = bid;
    this.audienceId = audienceId;
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

  canMoveTo(next: PendingTouchpointWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingTouchpointWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending touchpoint window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending touchpoint window"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.bid - this.impressions) * 100) / 100;
  }

  copy(): PendingTouchpointWindow {
    return new PendingTouchpointWindow(
      this.code,
      this.title,
      this.phone,
      this.impressions,
      this.bid,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending touchpoint window in status draft. */
export function newPendingTouchpointWindow(code: string, title: string): PendingTouchpointWindow {
  return new PendingTouchpointWindow(code, title, "", 0, 0, "", "draft");
}
