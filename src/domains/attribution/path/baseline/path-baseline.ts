/**
 * The path baseline records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path baseline is in its life cycle. */
export type PathBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** A path baseline. Its code is unique within a tenant. */
export class PathBaseline {
  code: string;
  label: string;
  ceiling: number;
  startsAt: number;
  rate: number;
  category: string;
  tags: string[];
  phone: string;
  status: PathBaselineStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    startsAt: number,
    rate: number,
    category: string,
    tags: string[],
    phone: string,
    status: PathBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.startsAt = startsAt;
    this.rate = rate;
    this.category = category;
    this.tags = tags;
    this.phone = phone;
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

  canMoveTo(next: PathBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PathBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"path baseline"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.startsAt + this.ceiling) * 100) / 100;
  }

  copy(): PathBaseline {
    return new PathBaseline(
      this.code,
      this.label,
      this.ceiling,
      this.startsAt,
      this.rate,
      this.category,
      this.tags,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a path baseline in status new. */
export function newPathBaseline(code: string, label: string): PathBaseline {
  return new PathBaseline(code, label, 0, 0, 0, "", [], "", "new");
}
