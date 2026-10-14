import * as text from "../../../../kit/text.js";

/** Where a rolling complaint notice is in its life cycle. */
export type RollingComplaintNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling complaint notice as the complaint team keeps it. */
export class RollingComplaintNotice {
  code: string;
  title: string;
  sendAt: number;
  quantity: number;
  summary: string;
  score: number;
  graceDays: number;
  channel: string;
  pinned: boolean;
  maximum: number;
  variant: string;
  status: RollingComplaintNoticeStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    quantity: number,
    summary: string,
    score: number,
    graceDays: number,
    channel: string,
    pinned: boolean,
    maximum: number,
    variant: string,
    status: RollingComplaintNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.quantity = quantity;
    this.summary = summary;
    this.score = score;
    this.graceDays = graceDays;
    this.channel = channel;
    this.pinned = pinned;
    this.maximum = maximum;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingComplaintNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingComplaintNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling complaint notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.score - this.graceDays) * 100) / 100;
  }

  copy(): RollingComplaintNotice {
    return new RollingComplaintNotice(
      this.code,
      this.title,
      this.sendAt,
      this.quantity,
      this.summary,
      this.score,
      this.graceDays,
      this.channel,
      this.pinned,
      this.maximum,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling complaint notice in status requested. */
export function newRollingComplaintNotice(code: string, title: string): RollingComplaintNotice {
  return new RollingComplaintNotice(code, title, 0, 0, "", 0, 0, "", false, 0, "", "requested");
}
