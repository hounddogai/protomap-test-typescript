/**
 * The pending post allocation records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending post allocation is in its life cycle. */
export type PendingPostAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a pending post allocation and its current status. */
export class PendingPostAllocation {
  code: string;
  name: string;
  ownerId: string;
  startsAt: number;
  margin: number;
  durationMinutes: number;
  timezone: string;
  tags: string[];
  sequence: number;
  conversionRate: number;
  threshold: number;
  status: PendingPostAllocationStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    startsAt: number,
    margin: number,
    durationMinutes: number,
    timezone: string,
    tags: string[],
    sequence: number,
    conversionRate: number,
    threshold: number,
    status: PendingPostAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.startsAt = startsAt;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.timezone = timezone;
    this.tags = tags;
    this.sequence = sequence;
    this.conversionRate = conversionRate;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingPostAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingPostAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending post allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending post allocation"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round(this.startsAt * this.durationMinutes * 100) / 100;
  }

  copy(): PendingPostAllocation {
    return new PendingPostAllocation(
      this.code,
      this.name,
      this.ownerId,
      this.startsAt,
      this.margin,
      this.durationMinutes,
      this.timezone,
      this.tags,
      this.sequence,
      this.conversionRate,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending post allocation in status proposed. */
export function newPendingPostAllocation(code: string, name: string): PendingPostAllocation {
  return new PendingPostAllocation(code, name, "", 0, 0, 0, "", [], 0, 0, 0, "proposed");
}
