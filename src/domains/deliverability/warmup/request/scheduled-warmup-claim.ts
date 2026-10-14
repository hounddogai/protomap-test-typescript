import * as text from "../../../../kit/text.js";

/** Where a scheduled warmup claim is in its life cycle. */
export type ScheduledWarmupClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled warmup claim as the warmup team keeps it. */
export class ScheduledWarmupClaim {
  code: string;
  label: string;
  locale: string;
  checksum: string;
  channel: string;
  description: string;
  country: string;
  windowDays: number;
  variant: string;
  sendAt: number;
  campaignRef: string;
  status: ScheduledWarmupClaimStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    checksum: string,
    channel: string,
    description: string,
    country: string,
    windowDays: number,
    variant: string,
    sendAt: number,
    campaignRef: string,
    status: ScheduledWarmupClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.checksum = checksum;
    this.channel = channel;
    this.description = description;
    this.country = country;
    this.windowDays = windowDays;
    this.variant = variant;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledWarmupClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledWarmupClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled warmup claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled warmup claim"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.windowDays * this.sendAt * 100) / 100;
  }

  copy(): ScheduledWarmupClaim {
    return new ScheduledWarmupClaim(
      this.code,
      this.label,
      this.locale,
      this.checksum,
      this.channel,
      this.description,
      this.country,
      this.windowDays,
      this.variant,
      this.sendAt,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled warmup claim in status open. */
export function newScheduledWarmupClaim(code: string, label: string): ScheduledWarmupClaim {
  return new ScheduledWarmupClaim(code, label, "", "", "", "", "", 0, "", 0, "", "open");
}
