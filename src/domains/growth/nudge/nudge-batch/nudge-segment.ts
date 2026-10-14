import * as text from "../../../../kit/text.js";

/** Where a nudge segment is in its life cycle. */
export type NudgeSegmentStatus = "created" | "validated" | "published" | "retired";

/** A nudge segment as the nudge team keeps it. */
export class NudgeSegment {
  code: string;
  label: string;
  sendAt: number;
  campaignRef: string;
  variant: string;
  createdAt: number;
  ownerId: string;
  pinned: boolean;
  status: NudgeSegmentStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    campaignRef: string,
    variant: string,
    createdAt: number,
    ownerId: string,
    pinned: boolean,
    status: NudgeSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
    this.variant = variant;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.pinned = pinned;
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

  canMoveTo(next: NudgeSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: NudgeSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round(this.createdAt * this.sendAt * 100) / 100;
  }

  copy(): NudgeSegment {
    return new NudgeSegment(
      this.code,
      this.label,
      this.sendAt,
      this.campaignRef,
      this.variant,
      this.createdAt,
      this.ownerId,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a nudge segment in status created. */
export function newNudgeSegment(code: string, label: string): NudgeSegment {
  return new NudgeSegment(code, label, 0, "", "", 0, "", false, "created");
}
