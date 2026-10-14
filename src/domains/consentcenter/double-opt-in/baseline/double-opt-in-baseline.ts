/**
 * The double opt in baseline records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in baseline is in its life cycle. */
export type DoubleOptInBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A double opt in baseline as the double opt in team keeps it. */
export class DoubleOptInBaseline {
  code: string;
  title: string;
  notes: string;
  visible: boolean;
  updatedAt: number;
  attempts: number;
  minimum: number;
  windowDays: number;
  channel: string;
  utmSource: string;
  status: DoubleOptInBaselineStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    visible: boolean,
    updatedAt: number,
    attempts: number,
    minimum: number,
    windowDays: number,
    channel: string,
    utmSource: string,
    status: DoubleOptInBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.visible = visible;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.channel = channel;
    this.utmSource = utmSource;
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

  canMoveTo(next: DoubleOptInBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DoubleOptInBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.minimum - this.windowDays) * 100) / 100;
  }

  copy(): DoubleOptInBaseline {
    return new DoubleOptInBaseline(
      this.code,
      this.title,
      this.notes,
      this.visible,
      this.updatedAt,
      this.attempts,
      this.minimum,
      this.windowDays,
      this.channel,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a double opt in baseline in status draft. */
export function newDoubleOptInBaseline(code: string, title: string): DoubleOptInBaseline {
  return new DoubleOptInBaseline(code, title, "", false, 0, 0, 0, 0, "", "", "draft");
}
