import * as text from "../../../../kit/text.js";

/** Where a fallback reply notice is in its life cycle. */
export type FallbackReplyNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback reply notice as the reply team keeps it. */
export class FallbackReplyNotice {
  code: string;
  title: string;
  externalRef: string;
  approved: boolean;
  threshold: number;
  updatedAt: number;
  sequence: number;
  status: FallbackReplyNoticeStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    approved: boolean,
    threshold: number,
    updatedAt: number,
    sequence: number,
    status: FallbackReplyNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.approved = approved;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
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

  canMoveTo(next: FallbackReplyNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackReplyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reply notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback reply notice"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.sequence * this.threshold * 100) / 100;
  }

  copy(): FallbackReplyNotice {
    return new FallbackReplyNotice(
      this.code,
      this.title,
      this.externalRef,
      this.approved,
      this.threshold,
      this.updatedAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback reply notice in status proposed. */
export function newFallbackReplyNotice(code: string, title: string): FallbackReplyNotice {
  return new FallbackReplyNotice(code, title, "", false, 0, 0, 0, "proposed");
}
