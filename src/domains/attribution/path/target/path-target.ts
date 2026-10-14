/**
 * The path target records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path target is in its life cycle. */
export type PathTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A path target as the path team keeps it. */
export class PathTarget {
  code: string;
  name: string;
  quantity: number;
  ratio: number;
  tags: string[];
  pinned: boolean;
  channel: string;
  archived: boolean;
  utmSource: string;
  timezone: string;
  status: PathTargetStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    ratio: number,
    tags: string[],
    pinned: boolean,
    channel: string,
    archived: boolean,
    utmSource: string,
    timezone: string,
    status: PathTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.ratio = ratio;
    this.tags = tags;
    this.pinned = pinned;
    this.channel = channel;
    this.archived = archived;
    this.utmSource = utmSource;
    this.timezone = timezone;
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

  canMoveTo(next: PathTargetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PathTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round(this.ratio * this.quantity * 100) / 100;
  }

  copy(): PathTarget {
    return new PathTarget(
      this.code,
      this.name,
      this.quantity,
      this.ratio,
      this.tags,
      this.pinned,
      this.channel,
      this.archived,
      this.utmSource,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a path target in status new. */
export function newPathTarget(code: string, name: string): PathTarget {
  return new PathTarget(code, name, 0, 0, [], false, "", false, "", "", "new");
}
