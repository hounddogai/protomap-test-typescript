import * as text from "../../../../kit/text.js";

/** Where a nudge target is in its life cycle. */
export type NudgeTargetStatus = "created" | "validated" | "published" | "retired";

/** The record of a nudge target and its current status. */
export class NudgeTarget {
  code: string;
  title: string;
  ownerId: string;
  campaignRef: string;
  bid: number;
  durationMinutes: number;
  audienceId: string;
  label: string;
  status: NudgeTargetStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    campaignRef: string,
    bid: number,
    durationMinutes: number,
    audienceId: string,
    label: string,
    status: NudgeTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: NudgeTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: NudgeTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"nudge target"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.durationMinutes + this.bid) * 100) / 100;
  }

  copy(): NudgeTarget {
    return new NudgeTarget(
      this.code,
      this.title,
      this.ownerId,
      this.campaignRef,
      this.bid,
      this.durationMinutes,
      this.audienceId,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a nudge target in status created. */
export function newNudgeTarget(code: string, title: string): NudgeTarget {
  return new NudgeTarget(code, title, "", "", 0, 0, "", "", "created");
}
