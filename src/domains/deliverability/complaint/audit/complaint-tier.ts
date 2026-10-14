import * as text from "../../../../kit/text.js";

/** Where a complaint tier is in its life cycle. */
export type ComplaintTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One complaint tier, with what the planners need to act on it. */
export class ComplaintTier {
  code: string;
  title: string;
  amount: number;
  locale: string;
  windowDays: number;
  sendAt: number;
  externalRef: string;
  rate: number;
  startsAt: number;
  label: string;
  status: ComplaintTierStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    locale: string,
    windowDays: number,
    sendAt: number,
    externalRef: string,
    rate: number,
    startsAt: number,
    label: string,
    status: ComplaintTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.locale = locale;
    this.windowDays = windowDays;
    this.sendAt = sendAt;
    this.externalRef = externalRef;
    this.rate = rate;
    this.startsAt = startsAt;
    this.label = label;
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

  canMoveTo(next: ComplaintTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: ComplaintTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"complaint tier"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.amount + this.sendAt) * 100) / 100;
  }

  copy(): ComplaintTier {
    return new ComplaintTier(
      this.code,
      this.title,
      this.amount,
      this.locale,
      this.windowDays,
      this.sendAt,
      this.externalRef,
      this.rate,
      this.startsAt,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a complaint tier in status idle. */
export function newComplaintTier(code: string, title: string): ComplaintTier {
  return new ComplaintTier(code, title, 0, "", 0, 0, "", 0, 0, "", "idle");
}
