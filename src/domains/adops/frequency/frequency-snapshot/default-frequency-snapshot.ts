/**
 * The default frequency snapshot records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default frequency snapshot is in its life cycle. */
export type DefaultFrequencySnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default frequency snapshot. Its code is unique within a tenant. */
export class DefaultFrequencySnapshot {
  code: string;
  name: string;
  version: number;
  sequence: number;
  durationMinutes: number;
  tags: string[];
  score: number;
  status: DefaultFrequencySnapshotStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    sequence: number,
    durationMinutes: number,
    tags: string[],
    score: number,
    status: DefaultFrequencySnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.tags = tags;
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

  canMoveTo(next: DefaultFrequencySnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultFrequencySnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default frequency snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"default frequency snapshot"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round((this.score + this.durationMinutes) * 100) / 100;
  }

  copy(): DefaultFrequencySnapshot {
    return new DefaultFrequencySnapshot(
      this.code,
      this.name,
      this.version,
      this.sequence,
      this.durationMinutes,
      this.tags,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default frequency snapshot in status planned. */
export function newDefaultFrequencySnapshot(code: string, name: string): DefaultFrequencySnapshot {
  return new DefaultFrequencySnapshot(code, name, 0, 0, 0, [], 0, "planned");
}
