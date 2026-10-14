/**
 * The approval group records of social's approval work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval group is in its life cycle. */
export type ApprovalGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One approval group, with what the planners need to act on it. */
export class ApprovalGroup {
  code: string;
  title: string;
  channel: string;
  variant: string;
  threshold: number;
  sequence: number;
  status: ApprovalGroupStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    variant: string,
    threshold: number,
    sequence: number,
    status: ApprovalGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.variant = variant;
    this.threshold = threshold;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ApprovalGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ApprovalGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"approval group"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.sequence + this.threshold) * 100) / 100;
  }

  copy(): ApprovalGroup {
    return new ApprovalGroup(
      this.code,
      this.title,
      this.channel,
      this.variant,
      this.threshold,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a approval group in status planned. */
export function newApprovalGroup(code: string, title: string): ApprovalGroup {
  return new ApprovalGroup(code, title, "", "", 0, 0, "planned");
}
