/**
 * The strict reward preference records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict reward preference is in its life cycle. */
export type StrictRewardPreferenceStatus = "created" | "validated" | "published" | "retired";

/** A strict reward preference as the reward team keeps it. */
export class StrictRewardPreference {
  code: string;
  title: string;
  archived: boolean;
  description: string;
  unit: string;
  batchSize: number;
  ratio: number;
  region: string;
  status: StrictRewardPreferenceStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    description: string,
    unit: string,
    batchSize: number,
    ratio: number,
    region: string,
    status: StrictRewardPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.description = description;
    this.unit = unit;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.region = region;
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

  canMoveTo(next: StrictRewardPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictRewardPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict reward preference"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.ratio + this.batchSize) * 100) / 100;
  }

  copy(): StrictRewardPreference {
    return new StrictRewardPreference(
      this.code,
      this.title,
      this.archived,
      this.description,
      this.unit,
      this.batchSize,
      this.ratio,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict reward preference in status created. */
export function newStrictRewardPreference(code: string, title: string): StrictRewardPreference {
  return new StrictRewardPreference(code, title, false, "", "", 0, 0, "", "created");
}
