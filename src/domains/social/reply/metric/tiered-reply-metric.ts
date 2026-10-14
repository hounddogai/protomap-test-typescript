/**
 * The tiered reply metric records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered reply metric is in its life cycle. */
export type TieredReplyMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered reply metric as the reply team keeps it. */
export class TieredReplyMetric {
  code: string;
  title: string;
  sendAt: number;
  audienceId: string;
  endsAt: number;
  batchSize: number;
  name: string;
  bid: number;
  minimum: number;
  status: TieredReplyMetricStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    audienceId: string,
    endsAt: number,
    batchSize: number,
    name: string,
    bid: number,
    minimum: number,
    status: TieredReplyMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.name = name;
    this.bid = bid;
    this.minimum = minimum;
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

  canMoveTo(next: TieredReplyMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredReplyMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reply metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered reply metric"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.sendAt * this.batchSize * 100) / 100;
  }

  copy(): TieredReplyMetric {
    return new TieredReplyMetric(
      this.code,
      this.title,
      this.sendAt,
      this.audienceId,
      this.endsAt,
      this.batchSize,
      this.name,
      this.bid,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered reply metric in status idle. */
export function newTieredReplyMetric(code: string, title: string): TieredReplyMetric {
  return new TieredReplyMetric(code, title, 0, "", 0, 0, "", 0, 0, "idle");
}
