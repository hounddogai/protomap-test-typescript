/**
 * The escalation variance records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation variance is in its life cycle. */
export type EscalationVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One escalation variance, with what the planners need to act on it. */
export class EscalationVariance {
  code: string;
  title: string;
  durationMinutes: number;
  visible: boolean;
  expiresAt: number;
  margin: number;
  country: string;
  sendAt: number;
  status: EscalationVarianceStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    visible: boolean,
    expiresAt: number,
    margin: number,
    country: string,
    sendAt: number,
    status: EscalationVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.country = country;
    this.sendAt = sendAt;
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

  canMoveTo(next: EscalationVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: EscalationVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.sendAt - this.expiresAt) * 100) / 100;
  }

  copy(): EscalationVariance {
    return new EscalationVariance(
      this.code,
      this.title,
      this.durationMinutes,
      this.visible,
      this.expiresAt,
      this.margin,
      this.country,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a escalation variance in status idle. */
export function newEscalationVariance(code: string, title: string): EscalationVariance {
  return new EscalationVariance(code, title, 0, false, 0, 0, "", 0, "idle");
}
