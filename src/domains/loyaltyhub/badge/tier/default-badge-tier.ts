/**
 * The default badge tier records of loyaltyhub's badge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default badge tier is in its life cycle. */
export type DefaultBadgeTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a default badge tier and its current status. */
export class DefaultBadgeTier {
  code: string;
  label: string;
  maximum: number;
  endsAt: number;
  threshold: number;
  channel: string;
  revision: number;
  phone: string;
  windowDays: number;
  status: DefaultBadgeTierStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    endsAt: number,
    threshold: number,
    channel: string,
    revision: number,
    phone: string,
    windowDays: number,
    status: DefaultBadgeTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.endsAt = endsAt;
    this.threshold = threshold;
    this.channel = channel;
    this.revision = revision;
    this.phone = phone;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultBadgeTierStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultBadgeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default badge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round((this.windowDays - this.maximum) * 100) / 100;
  }

  copy(): DefaultBadgeTier {
    return new DefaultBadgeTier(
      this.code,
      this.label,
      this.maximum,
      this.endsAt,
      this.threshold,
      this.channel,
      this.revision,
      this.phone,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default badge tier in status planned. */
export function newDefaultBadgeTier(code: string, label: string): DefaultBadgeTier {
  return new DefaultBadgeTier(code, label, 0, 0, 0, "", 0, "", 0, "planned");
}
