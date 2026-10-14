/**
 * The tiered window exception records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered window exception is in its life cycle. */
export type TieredWindowExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered window exception as the window team keeps it. */
export class TieredWindowException {
  code: string;
  title: string;
  channel: string;
  frequencyCap: number;
  ratio: number;
  impressions: number;
  source: string;
  contactEmail: string;
  maximum: number;
  minimum: number;
  score: number;
  status: TieredWindowExceptionStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    frequencyCap: number,
    ratio: number,
    impressions: number,
    source: string,
    contactEmail: string,
    maximum: number,
    minimum: number,
    score: number,
    status: TieredWindowExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.frequencyCap = frequencyCap;
    this.ratio = ratio;
    this.impressions = impressions;
    this.source = source;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.minimum = minimum;
    this.score = score;
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

  canMoveTo(next: TieredWindowExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredWindowExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered window exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.frequencyCap + this.maximum) * 100) / 100;
  }

  copy(): TieredWindowException {
    return new TieredWindowException(
      this.code,
      this.title,
      this.channel,
      this.frequencyCap,
      this.ratio,
      this.impressions,
      this.source,
      this.contactEmail,
      this.maximum,
      this.minimum,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered window exception in status planned. */
export function newTieredWindowException(code: string, title: string): TieredWindowException {
  return new TieredWindowException(code, title, "", 0, 0, 0, "", "", 0, 0, 0, "planned");
}
