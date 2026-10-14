/**
 * The global insight profile records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global insight profile is in its life cycle. */
export type GlobalInsightProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global insight profile. Its code is unique within a tenant. */
export class GlobalInsightProfile {
  code: string;
  name: string;
  attempts: number;
  summary: string;
  floorValue: number;
  capacity: number;
  status: GlobalInsightProfileStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    summary: string,
    floorValue: number,
    capacity: number,
    status: GlobalInsightProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.summary = summary;
    this.floorValue = floorValue;
    this.capacity = capacity;
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

  canMoveTo(next: GlobalInsightProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalInsightProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global insight profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.floorValue + this.capacity) * 100) / 100;
  }

  copy(): GlobalInsightProfile {
    return new GlobalInsightProfile(
      this.code,
      this.name,
      this.attempts,
      this.summary,
      this.floorValue,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global insight profile in status planned. */
export function newGlobalInsightProfile(code: string, name: string): GlobalInsightProfile {
  return new GlobalInsightProfile(code, name, 0, "", 0, 0, "planned");
}
