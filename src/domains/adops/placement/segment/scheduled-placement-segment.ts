/**
 * The scheduled placement segment records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled placement segment is in its life cycle. */
export type ScheduledPlacementSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled placement segment. Its code is unique within a tenant. */
export class ScheduledPlacementSegment {
  code: string;
  name: string;
  score: number;
  revision: number;
  ownerId: string;
  maximum: number;
  contactEmail: string;
  pinned: boolean;
  impressions: number;
  status: ScheduledPlacementSegmentStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    revision: number,
    ownerId: string,
    maximum: number,
    contactEmail: string,
    pinned: boolean,
    impressions: number,
    status: ScheduledPlacementSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.revision = revision;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
    this.impressions = impressions;
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

  canMoveTo(next: ScheduledPlacementSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ScheduledPlacementSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled placement segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.impressions - this.maximum) * 100) / 100;
  }

  copy(): ScheduledPlacementSegment {
    return new ScheduledPlacementSegment(
      this.code,
      this.name,
      this.score,
      this.revision,
      this.ownerId,
      this.maximum,
      this.contactEmail,
      this.pinned,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled placement segment in status idle. */
export function newScheduledPlacementSegment(code: string, name: string): ScheduledPlacementSegment {
  return new ScheduledPlacementSegment(code, name, 0, 0, "", 0, "", false, 0, "idle");
}
