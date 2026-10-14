/**
 * The batched branch preference records of journeys's branch work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched branch preference is in its life cycle. */
export type BatchedBranchPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched branch preference, with what the planners need to act on it. */
export class BatchedBranchPreference {
  code: string;
  title: string;
  attributes: Map<string, string>;
  minimum: number;
  endsAt: number;
  impressions: number;
  tags: string[];
  cost: number;
  variant: string;
  segment: string;
  updatedAt: number;
  status: BatchedBranchPreferenceStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    minimum: number,
    endsAt: number,
    impressions: number,
    tags: string[],
    cost: number,
    variant: string,
    segment: string,
    updatedAt: number,
    status: BatchedBranchPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.tags = tags;
    this.cost = cost;
    this.variant = variant;
    this.segment = segment;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: BatchedBranchPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedBranchPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched branch preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.cost + this.endsAt) * 100) / 100;
  }

  copy(): BatchedBranchPreference {
    return new BatchedBranchPreference(
      this.code,
      this.title,
      this.attributes,
      this.minimum,
      this.endsAt,
      this.impressions,
      this.tags,
      this.cost,
      this.variant,
      this.segment,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched branch preference in status new. */
export function newBatchedBranchPreference(code: string, title: string): BatchedBranchPreference {
  return new BatchedBranchPreference(code, title, new Map<string, string>(), 0, 0, 0, [], 0, "", "", 0, "new");
}
