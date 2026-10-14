/**
 * The tiered post threshold records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered post threshold is in its life cycle. */
export type TieredPostThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered post threshold and its current status. */
export class TieredPostThreshold {
  code: string;
  title: string;
  utmSource: string;
  priority: number;
  locale: string;
  channel: string;
  status: TieredPostThresholdStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    priority: number,
    locale: string,
    channel: string,
    status: TieredPostThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.priority = priority;
    this.locale = locale;
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

  canMoveTo(next: TieredPostThresholdStatus): boolean {
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
          case "draining":
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

  moveTo(next: TieredPostThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered post threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): TieredPostThreshold {
    return new TieredPostThreshold(
      this.code,
      this.title,
      this.utmSource,
      this.priority,
      this.locale,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered post threshold in status idle. */
export function newTieredPostThreshold(code: string, title: string): TieredPostThreshold {
  return new TieredPostThreshold(code, title, "", 0, "", "", "idle");
}
