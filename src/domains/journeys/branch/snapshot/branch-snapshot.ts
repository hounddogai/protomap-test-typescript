/**
 * The branch snapshot records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch snapshot is in its life cycle. */
export type BranchSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A branch snapshot as the branch team keeps it. */
export class BranchSnapshot {
  code: string;
  label: string;
  archived: boolean;
  channel: string;
  tags: string[];
  region: string;
  priority: number;
  notes: string;
  openRate: number;
  score: number;
  attempts: number;
  status: BranchSnapshotStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    channel: string,
    tags: string[],
    region: string,
    priority: number,
    notes: string,
    openRate: number,
    score: number,
    attempts: number,
    status: BranchSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.channel = channel;
    this.tags = tags;
    this.region = region;
    this.priority = priority;
    this.notes = notes;
    this.openRate = openRate;
    this.score = score;
    this.attempts = attempts;
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

  canMoveTo(next: BranchSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: BranchSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  weightedExposure(): number {
    return Math.round(this.score * this.priority * 100) / 100;
  }

  copy(): BranchSnapshot {
    return new BranchSnapshot(
      this.code,
      this.label,
      this.archived,
      this.channel,
      this.tags,
      this.region,
      this.priority,
      this.notes,
      this.openRate,
      this.score,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a branch snapshot in status open. */
export function newBranchSnapshot(code: string, label: string): BranchSnapshot {
  return new BranchSnapshot(code, label, false, "", [], "", 0, "", 0, 0, 0, "open");
}
