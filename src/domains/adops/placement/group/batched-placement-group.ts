/**
 * The batched placement group records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched placement group is in its life cycle. */
export type BatchedPlacementGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched placement group as the placement team keeps it. */
export class BatchedPlacementGroup {
  code: string;
  title: string;
  locale: string;
  notes: string;
  tags: string[];
  priority: number;
  version: number;
  channel: string;
  status: BatchedPlacementGroupStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    notes: string,
    tags: string[],
    priority: number,
    version: number,
    channel: string,
    status: BatchedPlacementGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.notes = notes;
    this.tags = tags;
    this.priority = priority;
    this.version = version;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedPlacementGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPlacementGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched placement group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"batched placement group"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.priority * this.version * 100) / 100;
  }

  copy(): BatchedPlacementGroup {
    return new BatchedPlacementGroup(
      this.code,
      this.title,
      this.locale,
      this.notes,
      this.tags,
      this.priority,
      this.version,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched placement group in status proposed. */
export function newBatchedPlacementGroup(code: string, title: string): BatchedPlacementGroup {
  return new BatchedPlacementGroup(code, title, "", "", [], 0, 0, "", "proposed");
}
