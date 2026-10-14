import * as text from "../../../../kit/text.js";

/** Where a invite notice is in its life cycle. */
export type InviteNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** One invite notice, with what the planners need to act on it. */
export class InviteNotice {
  code: string;
  label: string;
  priority: number;
  threshold: number;
  summary: string;
  bid: number;
  status: InviteNoticeStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    threshold: number,
    summary: string,
    bid: number,
    status: InviteNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.threshold = threshold;
    this.summary = summary;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round((this.threshold + this.bid) * 100) / 100;
  }

  copy(): InviteNotice {
    return new InviteNotice(this.code, this.label, this.priority, this.threshold, this.summary, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a invite notice in status new. */
export function newInviteNotice(code: string, label: string): InviteNotice {
  return new InviteNotice(code, label, 0, 0, "", 0, "new");
}
