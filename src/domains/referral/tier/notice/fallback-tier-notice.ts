import * as text from "../../../../kit/text.js";

/** Where a fallback tier notice is in its life cycle. */
export type FallbackTierNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback tier notice, with what the planners need to act on it. */
export class FallbackTierNotice {
  code: string;
  title: string;
  checksum: string;
  source: string;
  variant: string;
  name: string;
  amount: number;
  locale: string;
  region: string;
  rate: number;
  limit: number;
  status: FallbackTierNoticeStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    source: string,
    variant: string,
    name: string,
    amount: number,
    locale: string,
    region: string,
    rate: number,
    limit: number,
    status: FallbackTierNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.source = source;
    this.variant = variant;
    this.name = name;
    this.amount = amount;
    this.locale = locale;
    this.region = region;
    this.rate = rate;
    this.limit = limit;
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

  canMoveTo(next: FallbackTierNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
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

  moveTo(next: FallbackTierNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback tier notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.limit + this.amount) * 100) / 100;
  }

  copy(): FallbackTierNotice {
    return new FallbackTierNotice(
      this.code,
      this.title,
      this.checksum,
      this.source,
      this.variant,
      this.name,
      this.amount,
      this.locale,
      this.region,
      this.rate,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback tier notice in status idle. */
export function newFallbackTierNotice(code: string, title: string): FallbackTierNotice {
  return new FallbackTierNotice(code, title, "", "", "", "", 0, "", "", 0, 0, "idle");
}
