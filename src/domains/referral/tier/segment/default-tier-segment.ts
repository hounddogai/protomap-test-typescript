/**
 * The default tier segment records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default tier segment is in its life cycle. */
export type DefaultTierSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default tier segment as the tier team keeps it. */
export class DefaultTierSegment {
  code: string;
  label: string;
  endsAt: number;
  batchSize: number;
  priority: number;
  tags: string[];
  status: DefaultTierSegmentStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    batchSize: number,
    priority: number,
    tags: string[],
    status: DefaultTierSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.priority = priority;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultTierSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DefaultTierSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default tier segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.priority - this.batchSize) * 100) / 100;
  }

  copy(): DefaultTierSegment {
    return new DefaultTierSegment(
      this.code,
      this.label,
      this.endsAt,
      this.batchSize,
      this.priority,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default tier segment in status idle. */
export function newDefaultTierSegment(code: string, label: string): DefaultTierSegment {
  return new DefaultTierSegment(code, label, 0, 0, 0, [], "idle");
}
