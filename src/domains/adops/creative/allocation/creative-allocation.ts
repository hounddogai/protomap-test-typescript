/**
 * The creative allocation records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative allocation is in its life cycle. */
export type CreativeAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A creative allocation as the creative team keeps it. */
export class CreativeAllocation {
  code: string;
  name: string;
  category: string;
  label: string;
  cohort: string;
  journeyId: string;
  externalRef: string;
  expiresAt: number;
  windowDays: number;
  margin: number;
  status: CreativeAllocationStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    label: string,
    cohort: string,
    journeyId: string,
    externalRef: string,
    expiresAt: number,
    windowDays: number,
    margin: number,
    status: CreativeAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.label = label;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.windowDays = windowDays;
    this.margin = margin;
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

  canMoveTo(next: CreativeAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.margin - this.expiresAt) * 100) / 100;
  }

  copy(): CreativeAllocation {
    return new CreativeAllocation(
      this.code,
      this.name,
      this.category,
      this.label,
      this.cohort,
      this.journeyId,
      this.externalRef,
      this.expiresAt,
      this.windowDays,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a creative allocation in status idle. */
export function newCreativeAllocation(code: string, name: string): CreativeAllocation {
  return new CreativeAllocation(code, name, "", "", "", "", "", 0, 0, 0, "idle");
}
