import * as text from "../../../../kit/text.js";

/** Where a lenient csat checkpoint is in its life cycle. */
export type LenientCsatCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a lenient csat checkpoint and its current status. */
export class LenientCsatCheckpoint {
  code: string;
  label: string;
  timezone: string;
  audienceId: string;
  windowDays: number;
  channel: string;
  clicks: number;
  locale: string;
  currency: string;
  region: string;
  status: LenientCsatCheckpointStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    audienceId: string,
    windowDays: number,
    channel: string,
    clicks: number,
    locale: string,
    currency: string,
    region: string,
    status: LenientCsatCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.channel = channel;
    this.clicks = clicks;
    this.locale = locale;
    this.currency = currency;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientCsatCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientCsatCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient csat checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient csat checkpoint"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.clicks - this.windowDays) * 100) / 100;
  }

  copy(): LenientCsatCheckpoint {
    return new LenientCsatCheckpoint(
      this.code,
      this.label,
      this.timezone,
      this.audienceId,
      this.windowDays,
      this.channel,
      this.clicks,
      this.locale,
      this.currency,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient csat checkpoint in status draft. */
export function newLenientCsatCheckpoint(code: string, label: string): LenientCsatCheckpoint {
  return new LenientCsatCheckpoint(code, label, "", "", 0, "", 0, "", "", "", "draft");
}
