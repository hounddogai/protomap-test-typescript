/**
 * The sender segment records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender segment is in its life cycle. */
export type SenderSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One sender segment, with what the planners need to act on it. */
export class SenderSegment {
  code: string;
  label: string;
  expiresAt: number;
  campaignRef: string;
  score: number;
  status: SenderSegmentStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    campaignRef: string,
    score: number,
    status: SenderSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.score = score;
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

  canMoveTo(next: SenderSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"sender segment"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.score + this.expiresAt) * 100) / 100;
  }

  copy(): SenderSegment {
    return new SenderSegment(this.code, this.label, this.expiresAt, this.campaignRef, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sender segment in status idle. */
export function newSenderSegment(code: string, label: string): SenderSegment {
  return new SenderSegment(code, label, 0, "", 0, "idle");
}
