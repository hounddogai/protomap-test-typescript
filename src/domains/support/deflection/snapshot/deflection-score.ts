import * as text from "../../../../kit/text.js";

/** Where a deflection score is in its life cycle. */
export type DeflectionScoreStatus = "created" | "validated" | "published" | "retired";

/** A deflection score. Its code is unique within a tenant. */
export class DeflectionScore {
  code: string;
  label: string;
  channel: string;
  maximum: number;
  bid: number;
  checksum: string;
  limit: number;
  reviewer: string;
  windowDays: number;
  ceiling: number;
  status: DeflectionScoreStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    maximum: number,
    bid: number,
    checksum: string,
    limit: number,
    reviewer: string,
    windowDays: number,
    ceiling: number,
    status: DeflectionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.maximum = maximum;
    this.bid = bid;
    this.checksum = checksum;
    this.limit = limit;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.ceiling = ceiling;
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

  canMoveTo(next: DeflectionScoreStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"deflection score"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.limit * this.bid * 100) / 100;
  }

  copy(): DeflectionScore {
    return new DeflectionScore(
      this.code,
      this.label,
      this.channel,
      this.maximum,
      this.bid,
      this.checksum,
      this.limit,
      this.reviewer,
      this.windowDays,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a deflection score in status created. */
export function newDeflectionScore(code: string, label: string): DeflectionScore {
  return new DeflectionScore(code, label, "", 0, 0, "", 0, "", 0, 0, "created");
}
