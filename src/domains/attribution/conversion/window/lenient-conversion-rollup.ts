import * as text from "../../../../kit/text.js";

/** Where a lenient conversion rollup is in its life cycle. */
export type LenientConversionRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient conversion rollup. Its code is unique within a tenant. */
export class LenientConversionRollup {
  code: string;
  name: string;
  startsAt: number;
  windowDays: number;
  rate: number;
  currency: string;
  bid: number;
  region: string;
  status: LenientConversionRollupStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    windowDays: number,
    rate: number,
    currency: string,
    bid: number,
    region: string,
    status: LenientConversionRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.windowDays = windowDays;
    this.rate = rate;
    this.currency = currency;
    this.bid = bid;
    this.region = region;
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

  canMoveTo(next: LenientConversionRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientConversionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient conversion rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round(this.startsAt * this.windowDays * 100) / 100;
  }

  copy(): LenientConversionRollup {
    return new LenientConversionRollup(
      this.code,
      this.name,
      this.startsAt,
      this.windowDays,
      this.rate,
      this.currency,
      this.bid,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient conversion rollup in status idle. */
export function newLenientConversionRollup(code: string, name: string): LenientConversionRollup {
  return new LenientConversionRollup(code, name, 0, 0, 0, "", 0, "", "idle");
}
