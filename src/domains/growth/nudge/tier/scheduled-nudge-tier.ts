/**
 * The scheduled nudge tier records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled nudge tier is in its life cycle. */
export type ScheduledNudgeTierStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled nudge tier as the nudge team keeps it. */
export class ScheduledNudgeTier {
  code: string;
  title: string;
  ownerId: string;
  tags: string[];
  startsAt: number;
  status: ScheduledNudgeTierStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    tags: string[],
    startsAt: number,
    status: ScheduledNudgeTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.tags = tags;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledNudgeTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledNudgeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled nudge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): ScheduledNudgeTier {
    return new ScheduledNudgeTier(this.code, this.title, this.ownerId, this.tags, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled nudge tier in status requested. */
export function newScheduledNudgeTier(code: string, title: string): ScheduledNudgeTier {
  return new ScheduledNudgeTier(code, title, "", [], 0, "requested");
}
