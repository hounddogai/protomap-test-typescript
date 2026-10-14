import * as text from "../../../../kit/text.js";

/** Where a scheduled streak template is in its life cycle. */
export type ScheduledStreakTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a scheduled streak template and its current status. */
export class ScheduledStreakTemplate {
  code: string;
  label: string;
  title: string;
  frequencyCap: number;
  source: string;
  openRate: number;
  timezone: string;
  endsAt: number;
  bid: number;
  utmSource: string;
  country: string;
  status: ScheduledStreakTemplateStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    frequencyCap: number,
    source: string,
    openRate: number,
    timezone: string,
    endsAt: number,
    bid: number,
    utmSource: string,
    country: string,
    status: ScheduledStreakTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.openRate = openRate;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.bid = bid;
    this.utmSource = utmSource;
    this.country = country;
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

  canMoveTo(next: ScheduledStreakTemplateStatus): boolean {
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
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: ScheduledStreakTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled streak template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.frequencyCap + this.endsAt) * 100) / 100;
  }

  copy(): ScheduledStreakTemplate {
    return new ScheduledStreakTemplate(
      this.code,
      this.label,
      this.title,
      this.frequencyCap,
      this.source,
      this.openRate,
      this.timezone,
      this.endsAt,
      this.bid,
      this.utmSource,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled streak template in status idle. */
export function newScheduledStreakTemplate(code: string, label: string): ScheduledStreakTemplate {
  return new ScheduledStreakTemplate(code, label, "", 0, "", 0, "", 0, 0, "", "", "idle");
}
