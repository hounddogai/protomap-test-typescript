import * as text from "../../../../kit/text.js";

/** Where a batched branch notice is in its life cycle. */
export type BatchedBranchNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched branch notice and its current status. */
export class BatchedBranchNotice {
  code: string;
  title: string;
  phone: string;
  approved: boolean;
  sequence: number;
  channel: string;
  label: string;
  windowDays: number;
  clicks: number;
  status: BatchedBranchNoticeStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    approved: boolean,
    sequence: number,
    channel: string,
    label: string,
    windowDays: number,
    clicks: number,
    status: BatchedBranchNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.approved = approved;
    this.sequence = sequence;
    this.channel = channel;
    this.label = label;
    this.windowDays = windowDays;
    this.clicks = clicks;
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

  canMoveTo(next: BatchedBranchNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedBranchNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched branch notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched branch notice"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.sequence + this.windowDays) * 100) / 100;
  }

  copy(): BatchedBranchNotice {
    return new BatchedBranchNotice(
      this.code,
      this.title,
      this.phone,
      this.approved,
      this.sequence,
      this.channel,
      this.label,
      this.windowDays,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched branch notice in status requested. */
export function newBatchedBranchNotice(code: string, title: string): BatchedBranchNotice {
  return new BatchedBranchNotice(code, title, "", false, 0, "", "", 0, 0, "requested");
}
