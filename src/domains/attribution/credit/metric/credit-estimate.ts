import * as text from "../../../../kit/text.js";

/** Where a credit estimate is in its life cycle. */
export type CreditEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a credit estimate and its current status. */
export class CreditEstimate {
  code: string;
  title: string;
  checksum: string;
  channel: string;
  capacity: number;
  clicks: number;
  windowDays: number;
  ratio: number;
  tags: string[];
  batchSize: number;
  locale: string;
  status: CreditEstimateStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    channel: string,
    capacity: number,
    clicks: number,
    windowDays: number,
    ratio: number,
    tags: string[],
    batchSize: number,
    locale: string,
    status: CreditEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.channel = channel;
    this.capacity = capacity;
    this.clicks = clicks;
    this.windowDays = windowDays;
    this.ratio = ratio;
    this.tags = tags;
    this.batchSize = batchSize;
    this.locale = locale;
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

  canMoveTo(next: CreditEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CreditEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round((this.clicks + this.ratio) * 100) / 100;
  }

  copy(): CreditEstimate {
    return new CreditEstimate(
      this.code,
      this.title,
      this.checksum,
      this.channel,
      this.capacity,
      this.clicks,
      this.windowDays,
      this.ratio,
      this.tags,
      this.batchSize,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a credit estimate in status idle. */
export function newCreditEstimate(code: string, title: string): CreditEstimate {
  return new CreditEstimate(code, title, "", "", 0, 0, 0, 0, [], 0, "", "idle");
}
