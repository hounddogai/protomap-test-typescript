import * as text from "../../../../kit/text.js";

/** Where a streak notice is in its life cycle. */
export type StreakNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A streak notice as the streak team keeps it. */
export class StreakNotice {
  code: string;
  title: string;
  retries: number;
  minimum: number;
  weight: number;
  currency: string;
  label: string;
  conversionRate: number;
  status: StreakNoticeStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    minimum: number,
    weight: number,
    currency: string,
    label: string,
    conversionRate: number,
    status: StreakNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.minimum = minimum;
    this.weight = weight;
    this.currency = currency;
    this.label = label;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: StreakNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.minimum - this.conversionRate) * 100) / 100;
  }

  copy(): StreakNotice {
    return new StreakNotice(
      this.code,
      this.title,
      this.retries,
      this.minimum,
      this.weight,
      this.currency,
      this.label,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a streak notice in status idle. */
export function newStreakNotice(code: string, title: string): StreakNotice {
  return new StreakNotice(code, title, 0, 0, 0, "", "", 0, "idle");
}
