import * as text from "../../../../kit/text.js";

/** Where a lenient warmup variance is in its life cycle. */
export type LenientWarmupVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient warmup variance as the warmup team keeps it. */
export class LenientWarmupVariance {
  code: string;
  name: string;
  attempts: number;
  frequencyCap: number;
  conversionRate: number;
  title: string;
  version: number;
  channel: string;
  journeyId: string;
  durationMinutes: number;
  bid: number;
  status: LenientWarmupVarianceStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    frequencyCap: number,
    conversionRate: number,
    title: string,
    version: number,
    channel: string,
    journeyId: string,
    durationMinutes: number,
    bid: number,
    status: LenientWarmupVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.title = title;
    this.version = version;
    this.channel = channel;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
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

  canMoveTo(next: LenientWarmupVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientWarmupVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round(this.conversionRate * this.version * 100) / 100;
  }

  copy(): LenientWarmupVariance {
    return new LenientWarmupVariance(
      this.code,
      this.name,
      this.attempts,
      this.frequencyCap,
      this.conversionRate,
      this.title,
      this.version,
      this.channel,
      this.journeyId,
      this.durationMinutes,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient warmup variance in status idle. */
export function newLenientWarmupVariance(code: string, name: string): LenientWarmupVariance {
  return new LenientWarmupVariance(code, name, 0, 0, 0, "", 0, "", "", 0, 0, "idle");
}
