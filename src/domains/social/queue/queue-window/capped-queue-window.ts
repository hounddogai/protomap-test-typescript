/**
 * The capped queue window records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped queue window is in its life cycle. */
export type CappedQueueWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped queue window. Its code is unique within a tenant. */
export class CappedQueueWindow {
  code: string;
  name: string;
  rate: number;
  attributes: Map<string, string>;
  tags: string[];
  graceDays: number;
  status: CappedQueueWindowStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    attributes: Map<string, string>,
    tags: string[],
    graceDays: number,
    status: CappedQueueWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.attributes = attributes;
    this.tags = tags;
    this.graceDays = graceDays;
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

  canMoveTo(next: CappedQueueWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedQueueWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped queue window ${this.code} cannot move from ${this.status} to ${next}`);
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

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.rate + this.graceDays) * 100) / 100;
  }

  copy(): CappedQueueWindow {
    return new CappedQueueWindow(
      this.code,
      this.name,
      this.rate,
      this.attributes,
      this.tags,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped queue window in status open. */
export function newCappedQueueWindow(code: string, name: string): CappedQueueWindow {
  return new CappedQueueWindow(code, name, 0, new Map<string, string>(), [], 0, "open");
}
