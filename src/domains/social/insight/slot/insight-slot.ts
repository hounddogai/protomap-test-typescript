/**
 * The insight slot records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight slot is in its life cycle. */
export type InsightSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A insight slot. Its code is unique within a tenant. */
export class InsightSlot {
  code: string;
  name: string;
  floorValue: number;
  externalRef: string;
  ceiling: number;
  journeyId: string;
  region: string;
  channel: string;
  status: InsightSlotStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    externalRef: string,
    ceiling: number,
    journeyId: string,
    region: string,
    channel: string,
    status: InsightSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.externalRef = externalRef;
    this.ceiling = ceiling;
    this.journeyId = journeyId;
    this.region = region;
    this.channel = channel;
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

  canMoveTo(next: InsightSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.ceiling + this.floorValue) * 100) / 100;
  }

  copy(): InsightSlot {
    return new InsightSlot(
      this.code,
      this.name,
      this.floorValue,
      this.externalRef,
      this.ceiling,
      this.journeyId,
      this.region,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a insight slot in status planned. */
export function newInsightSlot(code: string, name: string): InsightSlot {
  return new InsightSlot(code, name, 0, "", 0, "", "", "", "planned");
}
