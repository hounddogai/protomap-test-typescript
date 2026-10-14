import * as text from "../../../../kit/text.js";

/** Where a reputation segment is in its life cycle. */
export type ReputationSegmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reputation segment as the reputation team keeps it. */
export class ReputationSegment {
  code: string;
  title: string;
  frequencyCap: number;
  unit: string;
  discount: number;
  endsAt: number;
  channel: string;
  status: ReputationSegmentStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    unit: string,
    discount: number,
    endsAt: number,
    channel: string,
    status: ReputationSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.unit = unit;
    this.discount = discount;
    this.endsAt = endsAt;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationSegmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.frequencyCap + this.discount) * 100) / 100;
  }

  copy(): ReputationSegment {
    return new ReputationSegment(
      this.code,
      this.title,
      this.frequencyCap,
      this.unit,
      this.discount,
      this.endsAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a reputation segment in status new. */
export function newReputationSegment(code: string, title: string): ReputationSegment {
  return new ReputationSegment(code, title, 0, "", 0, 0, "", "new");
}
