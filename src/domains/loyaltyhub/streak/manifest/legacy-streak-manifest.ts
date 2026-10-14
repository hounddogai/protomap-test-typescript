/**
 * The legacy streak manifest records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy streak manifest is in its life cycle. */
export type LegacyStreakManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy streak manifest as the streak team keeps it. */
export class LegacyStreakManifest {
  code: string;
  label: string;
  cost: number;
  description: string;
  priority: number;
  title: string;
  currency: string;
  locale: string;
  rate: number;
  bid: number;
  utmSource: string;
  status: LegacyStreakManifestStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    description: string,
    priority: number,
    title: string,
    currency: string,
    locale: string,
    rate: number,
    bid: number,
    utmSource: string,
    status: LegacyStreakManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.description = description;
    this.priority = priority;
    this.title = title;
    this.currency = currency;
    this.locale = locale;
    this.rate = rate;
    this.bid = bid;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyStreakManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyStreakManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy streak manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy streak manifest"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.cost * this.priority * 100) / 100;
  }

  copy(): LegacyStreakManifest {
    return new LegacyStreakManifest(
      this.code,
      this.label,
      this.cost,
      this.description,
      this.priority,
      this.title,
      this.currency,
      this.locale,
      this.rate,
      this.bid,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy streak manifest in status new. */
export function newLegacyStreakManifest(code: string, label: string): LegacyStreakManifest {
  return new LegacyStreakManifest(code, label, 0, "", 0, "", "", "", 0, 0, "", "new");
}
