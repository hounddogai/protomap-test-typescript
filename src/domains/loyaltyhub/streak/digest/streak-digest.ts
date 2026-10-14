/**
 * The streak digest records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak digest is in its life cycle. */
export type StreakDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A streak digest as the streak team keeps it. */
export class StreakDigest {
  code: string;
  label: string;
  source: string;
  batchSize: number;
  priority: number;
  impressions: number;
  pinned: boolean;
  ceiling: number;
  weight: number;
  status: StreakDigestStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    batchSize: number,
    priority: number,
    impressions: number,
    pinned: boolean,
    ceiling: number,
    weight: number,
    status: StreakDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.batchSize = batchSize;
    this.priority = priority;
    this.impressions = impressions;
    this.pinned = pinned;
    this.ceiling = ceiling;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.impressions * this.batchSize * 100) / 100;
  }

  copy(): StreakDigest {
    return new StreakDigest(
      this.code,
      this.label,
      this.source,
      this.batchSize,
      this.priority,
      this.impressions,
      this.pinned,
      this.ceiling,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a streak digest in status open. */
export function newStreakDigest(code: string, label: string): StreakDigest {
  return new StreakDigest(code, label, "", 0, 0, 0, false, 0, 0, "open");
}
