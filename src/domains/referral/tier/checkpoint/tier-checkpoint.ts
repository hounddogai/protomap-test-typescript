/**
 * The tier checkpoint records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier checkpoint is in its life cycle. */
export type TierCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One tier checkpoint, with what the planners need to act on it. */
export class TierCheckpoint {
  code: string;
  name: string;
  summary: string;
  active: boolean;
  timezone: string;
  source: string;
  capacity: number;
  reviewer: string;
  archived: boolean;
  tags: string[];
  status: TierCheckpointStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    active: boolean,
    timezone: string,
    source: string,
    capacity: number,
    reviewer: string,
    archived: boolean,
    tags: string[],
    status: TierCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.active = active;
    this.timezone = timezone;
    this.source = source;
    this.capacity = capacity;
    this.reviewer = reviewer;
    this.archived = archived;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TierCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tier checkpoint"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): TierCheckpoint {
    return new TierCheckpoint(
      this.code,
      this.name,
      this.summary,
      this.active,
      this.timezone,
      this.source,
      this.capacity,
      this.reviewer,
      this.archived,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tier checkpoint in status draft. */
export function newTierCheckpoint(code: string, name: string): TierCheckpoint {
  return new TierCheckpoint(code, name, "", false, "", "", 0, "", false, [], "draft");
}
