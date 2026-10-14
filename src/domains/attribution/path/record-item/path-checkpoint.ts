import * as text from "../../../../kit/text.js";

/** Where a path checkpoint is in its life cycle. */
export type PathCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a path checkpoint and its current status. */
export class PathCheckpoint {
  code: string;
  name: string;
  notes: string;
  startsAt: number;
  impressions: number;
  capacity: number;
  tags: string[];
  country: string;
  status: PathCheckpointStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    startsAt: number,
    impressions: number,
    capacity: number,
    tags: string[],
    country: string,
    status: PathCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.capacity = capacity;
    this.tags = tags;
    this.country = country;
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

  canMoveTo(next: PathCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PathCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.impressions + this.startsAt) * 100) / 100;
  }

  copy(): PathCheckpoint {
    return new PathCheckpoint(
      this.code,
      this.name,
      this.notes,
      this.startsAt,
      this.impressions,
      this.capacity,
      this.tags,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a path checkpoint in status new. */
export function newPathCheckpoint(code: string, name: string): PathCheckpoint {
  return new PathCheckpoint(code, name, "", 0, 0, 0, [], "", "new");
}
