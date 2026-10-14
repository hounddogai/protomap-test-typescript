import * as text from "../../../../kit/text.js";

/** Where a pending creative segment is in its life cycle. */
export type PendingCreativeSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending creative segment and its current status. */
export class PendingCreativeSegment {
  code: string;
  title: string;
  rate: number;
  sequence: number;
  visible: boolean;
  description: string;
  expiresAt: number;
  status: PendingCreativeSegmentStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    sequence: number,
    visible: boolean,
    description: string,
    expiresAt: number,
    status: PendingCreativeSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.sequence = sequence;
    this.visible = visible;
    this.description = description;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingCreativeSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingCreativeSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending creative segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending creative segment"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.sequence * this.rate * 100) / 100;
  }

  copy(): PendingCreativeSegment {
    return new PendingCreativeSegment(
      this.code,
      this.title,
      this.rate,
      this.sequence,
      this.visible,
      this.description,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending creative segment in status open. */
export function newPendingCreativeSegment(code: string, title: string): PendingCreativeSegment {
  return new PendingCreativeSegment(code, title, 0, 0, false, "", 0, "open");
}
