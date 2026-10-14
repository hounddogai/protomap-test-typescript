import * as text from "../../../../kit/text.js";

/** Where a strict reward digest is in its life cycle. */
export type StrictRewardDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a strict reward digest and its current status. */
export class StrictRewardDigest {
  code: string;
  label: string;
  channel: string;
  rate: number;
  batchSize: number;
  status: StrictRewardDigestStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    rate: number,
    batchSize: number,
    status: StrictRewardDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.rate = rate;
    this.batchSize = batchSize;
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

  canMoveTo(next: StrictRewardDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "cancelled";
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

  moveTo(next: StrictRewardDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netValue(): number {
    return Math.round((this.rate + this.batchSize) * 100) / 100;
  }

  copy(): StrictRewardDigest {
    return new StrictRewardDigest(this.code, this.label, this.channel, this.rate, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict reward digest in status planned. */
export function newStrictRewardDigest(code: string, label: string): StrictRewardDigest {
  return new StrictRewardDigest(code, label, "", 0, 0, "planned");
}
