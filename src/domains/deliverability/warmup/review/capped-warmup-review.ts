/**
 * The capped warmup review records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped warmup review is in its life cycle. */
export type CappedWarmupReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped warmup review as the warmup team keeps it. */
export class CappedWarmupReview {
  code: string;
  label: string;
  weight: number;
  audienceId: string;
  notes: string;
  name: string;
  unit: string;
  locale: string;
  channel: string;
  country: string;
  status: CappedWarmupReviewStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    audienceId: string,
    notes: string,
    name: string,
    unit: string,
    locale: string,
    channel: string,
    country: string,
    status: CappedWarmupReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.audienceId = audienceId;
    this.notes = notes;
    this.name = name;
    this.unit = unit;
    this.locale = locale;
    this.channel = channel;
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

  canMoveTo(next: CappedWarmupReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: CappedWarmupReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped warmup review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): CappedWarmupReview {
    return new CappedWarmupReview(
      this.code,
      this.label,
      this.weight,
      this.audienceId,
      this.notes,
      this.name,
      this.unit,
      this.locale,
      this.channel,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped warmup review in status idle. */
export function newCappedWarmupReview(code: string, label: string): CappedWarmupReview {
  return new CappedWarmupReview(code, label, 0, "", "", "", "", "", "", "", "idle");
}
