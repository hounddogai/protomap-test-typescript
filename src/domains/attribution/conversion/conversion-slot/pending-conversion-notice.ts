import * as text from "../../../../kit/text.js";

/** Where a pending conversion notice is in its life cycle. */
export type PendingConversionNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending conversion notice and its current status. */
export class PendingConversionNotice {
  code: string;
  title: string;
  pinned: boolean;
  segment: string;
  maximum: number;
  discount: number;
  score: number;
  status: PendingConversionNoticeStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    segment: string,
    maximum: number,
    discount: number,
    score: number,
    status: PendingConversionNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.segment = segment;
    this.maximum = maximum;
    this.discount = discount;
    this.score = score;
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

  canMoveTo(next: PendingConversionNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingConversionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending conversion notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round(this.maximum * this.discount * 100) / 100;
  }

  copy(): PendingConversionNotice {
    return new PendingConversionNotice(
      this.code,
      this.title,
      this.pinned,
      this.segment,
      this.maximum,
      this.discount,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending conversion notice in status draft. */
export function newPendingConversionNotice(code: string, title: string): PendingConversionNotice {
  return new PendingConversionNotice(code, title, false, "", 0, 0, 0, "draft");
}
