/**
 * The weighted deflection entry records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted deflection entry is in its life cycle. */
export type WeightedDeflectionEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted deflection entry. Its code is unique within a tenant. */
export class WeightedDeflectionEntry {
  code: string;
  label: string;
  startsAt: number;
  pinned: boolean;
  description: string;
  cost: number;
  tags: string[];
  amount: number;
  audienceId: string;
  status: WeightedDeflectionEntryStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    pinned: boolean,
    description: string,
    cost: number,
    tags: string[],
    amount: number,
    audienceId: string,
    status: WeightedDeflectionEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.pinned = pinned;
    this.description = description;
    this.cost = cost;
    this.tags = tags;
    this.amount = amount;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedDeflectionEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedDeflectionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted deflection entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.amount - this.startsAt) * 100) / 100;
  }

  copy(): WeightedDeflectionEntry {
    return new WeightedDeflectionEntry(
      this.code,
      this.label,
      this.startsAt,
      this.pinned,
      this.description,
      this.cost,
      this.tags,
      this.amount,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted deflection entry in status open. */
export function newWeightedDeflectionEntry(code: string, label: string): WeightedDeflectionEntry {
  return new WeightedDeflectionEntry(code, label, 0, false, "", 0, [], 0, "", "open");
}
