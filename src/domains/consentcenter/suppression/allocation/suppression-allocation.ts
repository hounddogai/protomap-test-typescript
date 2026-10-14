/**
 * The suppression allocation records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression allocation is in its life cycle. */
export type SuppressionAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression allocation as the suppression team keeps it. */
export class SuppressionAllocation {
  code: string;
  name: string;
  windowDays: number;
  floorValue: number;
  endsAt: number;
  variant: string;
  source: string;
  batchSize: number;
  tags: string[];
  utmSource: string;
  status: SuppressionAllocationStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    floorValue: number,
    endsAt: number,
    variant: string,
    source: string,
    batchSize: number,
    tags: string[],
    utmSource: string,
    status: SuppressionAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.floorValue = floorValue;
    this.endsAt = endsAt;
    this.variant = variant;
    this.source = source;
    this.batchSize = batchSize;
    this.tags = tags;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SuppressionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
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

  netExposure(): number {
    return Math.round(this.floorValue * this.batchSize * 100) / 100;
  }

  copy(): SuppressionAllocation {
    return new SuppressionAllocation(
      this.code,
      this.name,
      this.windowDays,
      this.floorValue,
      this.endsAt,
      this.variant,
      this.source,
      this.batchSize,
      this.tags,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a suppression allocation in status planned. */
export function newSuppressionAllocation(code: string, name: string): SuppressionAllocation {
  return new SuppressionAllocation(code, name, 0, 0, 0, "", "", 0, [], "", "planned");
}
