/**
 * The subscription window records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription window is in its life cycle. */
export type SubscriptionWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A subscription window. Its code is unique within a tenant. */
export class SubscriptionWindow {
  code: string;
  label: string;
  conversionRate: number;
  margin: number;
  score: number;
  revision: number;
  durationMinutes: number;
  maximum: number;
  status: SubscriptionWindowStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    margin: number,
    score: number,
    revision: number,
    durationMinutes: number,
    maximum: number,
    status: SubscriptionWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.margin = margin;
    this.score = score;
    this.revision = revision;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: SubscriptionWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SubscriptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.revision + this.maximum) * 100) / 100;
  }

  copy(): SubscriptionWindow {
    return new SubscriptionWindow(
      this.code,
      this.label,
      this.conversionRate,
      this.margin,
      this.score,
      this.revision,
      this.durationMinutes,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a subscription window in status idle. */
export function newSubscriptionWindow(code: string, label: string): SubscriptionWindow {
  return new SubscriptionWindow(code, label, 0, 0, 0, 0, 0, 0, "idle");
}
