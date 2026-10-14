/**
 * The conversion threshold records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion threshold is in its life cycle. */
export type ConversionThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** A conversion threshold as the conversion team keeps it. */
export class ConversionThreshold {
  code: string;
  title: string;
  archived: boolean;
  score: number;
  timezone: string;
  minimum: number;
  source: string;
  createdAt: number;
  weight: number;
  durationMinutes: number;
  status: ConversionThresholdStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    score: number,
    timezone: string,
    minimum: number,
    source: string,
    createdAt: number,
    weight: number,
    durationMinutes: number,
    status: ConversionThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.score = score;
    this.timezone = timezone;
    this.minimum = minimum;
    this.source = source;
    this.createdAt = createdAt;
    this.weight = weight;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ConversionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"conversion threshold"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.minimum * this.createdAt * 100) / 100;
  }

  copy(): ConversionThreshold {
    return new ConversionThreshold(
      this.code,
      this.title,
      this.archived,
      this.score,
      this.timezone,
      this.minimum,
      this.source,
      this.createdAt,
      this.weight,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a conversion threshold in status requested. */
export function newConversionThreshold(code: string, title: string): ConversionThreshold {
  return new ConversionThreshold(code, title, false, 0, "", 0, "", 0, 0, 0, "requested");
}
