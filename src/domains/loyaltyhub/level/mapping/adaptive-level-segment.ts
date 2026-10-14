import * as text from "../../../../kit/text.js";

/** Where a adaptive level segment is in its life cycle. */
export type AdaptiveLevelSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive level segment as the level team keeps it. */
export class AdaptiveLevelSegment {
  code: string;
  title: string;
  createdAt: number;
  sequence: number;
  openRate: number;
  channel: string;
  status: AdaptiveLevelSegmentStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    sequence: number,
    openRate: number,
    channel: string,
    status: AdaptiveLevelSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.sequence = sequence;
    this.openRate = openRate;
    this.channel = channel;
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

  canMoveTo(next: AdaptiveLevelSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveLevelSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive level segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive level segment"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.createdAt + this.sequence) * 100) / 100;
  }

  copy(): AdaptiveLevelSegment {
    return new AdaptiveLevelSegment(
      this.code,
      this.title,
      this.createdAt,
      this.sequence,
      this.openRate,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive level segment in status proposed. */
export function newAdaptiveLevelSegment(code: string, title: string): AdaptiveLevelSegment {
  return new AdaptiveLevelSegment(code, title, 0, 0, 0, "", "proposed");
}
