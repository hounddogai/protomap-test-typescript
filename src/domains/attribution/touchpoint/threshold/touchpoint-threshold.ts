/**
 * The touchpoint threshold records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint threshold is in its life cycle. */
export type TouchpointThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A touchpoint threshold as the touchpoint team keeps it. */
export class TouchpointThreshold {
  code: string;
  label: string;
  retries: number;
  channel: string;
  approved: boolean;
  locale: string;
  title: string;
  region: string;
  amount: number;
  source: string;
  timezone: string;
  status: TouchpointThresholdStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    channel: string,
    approved: boolean,
    locale: string,
    title: string,
    region: string,
    amount: number,
    source: string,
    timezone: string,
    status: TouchpointThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.channel = channel;
    this.approved = approved;
    this.locale = locale;
    this.title = title;
    this.region = region;
    this.amount = amount;
    this.source = source;
    this.timezone = timezone;
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

  canMoveTo(next: TouchpointThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TouchpointThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint threshold"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.amount * this.retries * 100) / 100;
  }

  copy(): TouchpointThreshold {
    return new TouchpointThreshold(
      this.code,
      this.label,
      this.retries,
      this.channel,
      this.approved,
      this.locale,
      this.title,
      this.region,
      this.amount,
      this.source,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a touchpoint threshold in status draft. */
export function newTouchpointThreshold(code: string, label: string): TouchpointThreshold {
  return new TouchpointThreshold(code, label, 0, "", false, "", "", "", 0, "", "", "draft");
}
