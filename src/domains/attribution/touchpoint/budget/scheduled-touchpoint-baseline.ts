import * as text from "../../../../kit/text.js";

/** Where a scheduled touchpoint baseline is in its life cycle. */
export type ScheduledTouchpointBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a scheduled touchpoint baseline and its current status. */
export class ScheduledTouchpointBaseline {
  code: string;
  label: string;
  sendAt: number;
  region: string;
  margin: number;
  contactEmail: string;
  expiresAt: number;
  attempts: number;
  reviewer: string;
  discount: number;
  status: ScheduledTouchpointBaselineStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    region: string,
    margin: number,
    contactEmail: string,
    expiresAt: number,
    attempts: number,
    reviewer: string,
    discount: number,
    status: ScheduledTouchpointBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.region = region;
    this.margin = margin;
    this.contactEmail = contactEmail;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.discount = discount;
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

  canMoveTo(next: ScheduledTouchpointBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
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

  moveTo(next: ScheduledTouchpointBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled touchpoint baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.margin * this.discount * 100) / 100;
  }

  copy(): ScheduledTouchpointBaseline {
    return new ScheduledTouchpointBaseline(
      this.code,
      this.label,
      this.sendAt,
      this.region,
      this.margin,
      this.contactEmail,
      this.expiresAt,
      this.attempts,
      this.reviewer,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled touchpoint baseline in status idle. */
export function newScheduledTouchpointBaseline(code: string, label: string): ScheduledTouchpointBaseline {
  return new ScheduledTouchpointBaseline(code, label, 0, "", 0, "", 0, 0, "", 0, "idle");
}
