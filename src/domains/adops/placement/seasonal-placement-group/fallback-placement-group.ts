/**
 * The fallback placement group records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback placement group is in its life cycle. */
export type FallbackPlacementGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback placement group and its current status. */
export class FallbackPlacementGroup {
  code: string;
  title: string;
  journeyId: string;
  tags: string[];
  startsAt: number;
  segment: string;
  conversionRate: number;
  floorValue: number;
  status: FallbackPlacementGroupStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    tags: string[],
    startsAt: number,
    segment: string,
    conversionRate: number,
    floorValue: number,
    status: FallbackPlacementGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.tags = tags;
    this.startsAt = startsAt;
    this.segment = segment;
    this.conversionRate = conversionRate;
    this.floorValue = floorValue;
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

  canMoveTo(next: FallbackPlacementGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackPlacementGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback placement group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.floorValue - this.conversionRate) * 100) / 100;
  }

  copy(): FallbackPlacementGroup {
    return new FallbackPlacementGroup(
      this.code,
      this.title,
      this.journeyId,
      this.tags,
      this.startsAt,
      this.segment,
      this.conversionRate,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback placement group in status idle. */
export function newFallbackPlacementGroup(code: string, title: string): FallbackPlacementGroup {
  return new FallbackPlacementGroup(code, title, "", [], 0, "", 0, 0, "idle");
}
