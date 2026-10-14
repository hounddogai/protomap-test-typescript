/**
 * The bounce override records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce override is in its life cycle. */
export type BounceOverrideStatus = "created" | "validated" | "published" | "retired";

/** A bounce override as the bounce team keeps it. */
export class BounceOverride {
  code: string;
  title: string;
  channel: string;
  name: string;
  threshold: number;
  graceDays: number;
  status: BounceOverrideStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    name: string,
    threshold: number,
    graceDays: number,
    status: BounceOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.name = name;
    this.threshold = threshold;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BounceOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round((this.graceDays + this.threshold) * 100) / 100;
  }

  copy(): BounceOverride {
    return new BounceOverride(
      this.code,
      this.title,
      this.channel,
      this.name,
      this.threshold,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a bounce override in status created. */
export function newBounceOverride(code: string, title: string): BounceOverride {
  return new BounceOverride(code, title, "", "", 0, 0, "created");
}
