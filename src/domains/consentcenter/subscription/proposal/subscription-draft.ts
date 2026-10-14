import * as text from "../../../../kit/text.js";

/** Where a subscription draft is in its life cycle. */
export type SubscriptionDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a subscription draft and its current status. */
export class SubscriptionDraft {
  code: string;
  label: string;
  active: boolean;
  conversionRate: number;
  durationMinutes: number;
  utmSource: string;
  createdAt: number;
  version: number;
  threshold: number;
  checksum: string;
  status: SubscriptionDraftStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    conversionRate: number,
    durationMinutes: number,
    utmSource: string,
    createdAt: number,
    version: number,
    threshold: number,
    checksum: string,
    status: SubscriptionDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.conversionRate = conversionRate;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
    this.createdAt = createdAt;
    this.version = version;
    this.threshold = threshold;
    this.checksum = checksum;
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

  canMoveTo(next: SubscriptionDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"subscription draft"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.createdAt - this.threshold) * 100) / 100;
  }

  copy(): SubscriptionDraft {
    return new SubscriptionDraft(
      this.code,
      this.label,
      this.active,
      this.conversionRate,
      this.durationMinutes,
      this.utmSource,
      this.createdAt,
      this.version,
      this.threshold,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a subscription draft in status idle. */
export function newSubscriptionDraft(code: string, label: string): SubscriptionDraft {
  return new SubscriptionDraft(code, label, false, 0, 0, "", 0, 0, 0, "", "idle");
}
