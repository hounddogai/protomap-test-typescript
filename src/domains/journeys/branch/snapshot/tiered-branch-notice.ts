import * as text from "../../../../kit/text.js";

/** Where a tiered branch notice is in its life cycle. */
export type TieredBranchNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered branch notice and its current status. */
export class TieredBranchNotice {
  code: string;
  title: string;
  sequence: number;
  amount: number;
  pinned: boolean;
  segment: string;
  source: string;
  threshold: number;
  status: TieredBranchNoticeStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    amount: number,
    pinned: boolean,
    segment: string,
    source: string,
    threshold: number,
    status: TieredBranchNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.amount = amount;
    this.pinned = pinned;
    this.segment = segment;
    this.source = source;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredBranchNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredBranchNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered branch notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.amount - this.sequence) * 100) / 100;
  }

  copy(): TieredBranchNotice {
    return new TieredBranchNotice(
      this.code,
      this.title,
      this.sequence,
      this.amount,
      this.pinned,
      this.segment,
      this.source,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered branch notice in status proposed. */
export function newTieredBranchNotice(code: string, title: string): TieredBranchNotice {
  return new TieredBranchNotice(code, title, 0, 0, false, "", "", 0, "proposed");
}
