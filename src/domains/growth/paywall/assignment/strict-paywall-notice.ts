import * as text from "../../../../kit/text.js";

/** Where a strict paywall notice is in its life cycle. */
export type StrictPaywallNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One strict paywall notice, with what the planners need to act on it. */
export class StrictPaywallNotice {
  code: string;
  title: string;
  openRate: number;
  phone: string;
  startsAt: number;
  campaignRef: string;
  score: number;
  maximum: number;
  status: StrictPaywallNoticeStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    phone: string,
    startsAt: number,
    campaignRef: string,
    score: number,
    maximum: number,
    status: StrictPaywallNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.phone = phone;
    this.startsAt = startsAt;
    this.campaignRef = campaignRef;
    this.score = score;
    this.maximum = maximum;
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

  canMoveTo(next: StrictPaywallNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPaywallNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict paywall notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round(this.startsAt * this.score * 100) / 100;
  }

  copy(): StrictPaywallNotice {
    return new StrictPaywallNotice(
      this.code,
      this.title,
      this.openRate,
      this.phone,
      this.startsAt,
      this.campaignRef,
      this.score,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict paywall notice in status idle. */
export function newStrictPaywallNotice(code: string, title: string): StrictPaywallNotice {
  return new StrictPaywallNotice(code, title, 0, "", 0, "", 0, 0, "idle");
}
