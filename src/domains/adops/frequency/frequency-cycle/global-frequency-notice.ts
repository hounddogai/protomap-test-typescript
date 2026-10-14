import * as text from "../../../../kit/text.js";

/** Where a global frequency notice is in its life cycle. */
export type GlobalFrequencyNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global frequency notice as the frequency team keeps it. */
export class GlobalFrequencyNotice {
  code: string;
  name: string;
  segment: string;
  capacity: number;
  variant: string;
  discount: number;
  openRate: number;
  currency: string;
  minimum: number;
  durationMinutes: number;
  status: GlobalFrequencyNoticeStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    capacity: number,
    variant: string,
    discount: number,
    openRate: number,
    currency: string,
    minimum: number,
    durationMinutes: number,
    status: GlobalFrequencyNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.capacity = capacity;
    this.variant = variant;
    this.discount = discount;
    this.openRate = openRate;
    this.currency = currency;
    this.minimum = minimum;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: GlobalFrequencyNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFrequencyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global frequency notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.durationMinutes - this.discount) * 100) / 100;
  }

  copy(): GlobalFrequencyNotice {
    return new GlobalFrequencyNotice(
      this.code,
      this.name,
      this.segment,
      this.capacity,
      this.variant,
      this.discount,
      this.openRate,
      this.currency,
      this.minimum,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global frequency notice in status idle. */
export function newGlobalFrequencyNotice(code: string, name: string): GlobalFrequencyNotice {
  return new GlobalFrequencyNotice(code, name, "", 0, "", 0, 0, "", 0, 0, "idle");
}
