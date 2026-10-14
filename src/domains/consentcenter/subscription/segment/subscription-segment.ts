/**
 * The subscription segment records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription segment is in its life cycle. */
export type SubscriptionSegmentStatus = "created" | "validated" | "published" | "retired";

/** One subscription segment, with what the planners need to act on it. */
export class SubscriptionSegment {
  code: string;
  label: string;
  title: string;
  timezone: string;
  segment: string;
  rate: number;
  pinned: boolean;
  locale: string;
  revision: number;
  notes: string;
  status: SubscriptionSegmentStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    timezone: string,
    segment: string,
    rate: number,
    pinned: boolean,
    locale: string,
    revision: number,
    notes: string,
    status: SubscriptionSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.timezone = timezone;
    this.segment = segment;
    this.rate = rate;
    this.pinned = pinned;
    this.locale = locale;
    this.revision = revision;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SubscriptionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"subscription segment"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.revision - this.rate) * 100) / 100;
  }

  copy(): SubscriptionSegment {
    return new SubscriptionSegment(
      this.code,
      this.label,
      this.title,
      this.timezone,
      this.segment,
      this.rate,
      this.pinned,
      this.locale,
      this.revision,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a subscription segment in status created. */
export function newSubscriptionSegment(code: string, label: string): SubscriptionSegment {
  return new SubscriptionSegment(code, label, "", "", "", 0, false, "", 0, "", "created");
}
