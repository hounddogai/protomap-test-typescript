/**
 * The double opt in threshold records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in threshold is in its life cycle. */
export type DoubleOptInThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a double opt in threshold and its current status. */
export class DoubleOptInThreshold {
  code: string;
  title: string;
  impressions: number;
  cohort: string;
  utmSource: string;
  channel: string;
  name: string;
  active: boolean;
  batchSize: number;
  version: number;
  status: DoubleOptInThresholdStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    cohort: string,
    utmSource: string,
    channel: string,
    name: string,
    active: boolean,
    batchSize: number,
    version: number,
    status: DoubleOptInThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.channel = channel;
    this.name = name;
    this.active = active;
    this.batchSize = batchSize;
    this.version = version;
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

  canMoveTo(next: DoubleOptInThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DoubleOptInThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netVolume(): number {
    return Math.round((this.version - this.impressions) * 100) / 100;
  }

  copy(): DoubleOptInThreshold {
    return new DoubleOptInThreshold(
      this.code,
      this.title,
      this.impressions,
      this.cohort,
      this.utmSource,
      this.channel,
      this.name,
      this.active,
      this.batchSize,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a double opt in threshold in status requested. */
export function newDoubleOptInThreshold(code: string, title: string): DoubleOptInThreshold {
  return new DoubleOptInThreshold(code, title, 0, "", "", "", "", false, 0, 0, "requested");
}
