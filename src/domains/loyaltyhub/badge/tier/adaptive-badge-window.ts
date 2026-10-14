import * as text from "../../../../kit/text.js";

/** Where a adaptive badge window is in its life cycle. */
export type AdaptiveBadgeWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a adaptive badge window and its current status. */
export class AdaptiveBadgeWindow {
  code: string;
  label: string;
  locale: string;
  country: string;
  capacity: number;
  channel: string;
  status: AdaptiveBadgeWindowStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    country: string,
    capacity: number,
    channel: string,
    status: AdaptiveBadgeWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.country = country;
    this.capacity = capacity;
    this.channel = channel;
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

  canMoveTo(next: AdaptiveBadgeWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready";
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

  moveTo(next: AdaptiveBadgeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive badge window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive badge window"} ${this.code}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): AdaptiveBadgeWindow {
    return new AdaptiveBadgeWindow(
      this.code,
      this.label,
      this.locale,
      this.country,
      this.capacity,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive badge window in status idle. */
export function newAdaptiveBadgeWindow(code: string, label: string): AdaptiveBadgeWindow {
  return new AdaptiveBadgeWindow(code, label, "", "", 0, "", "idle");
}
