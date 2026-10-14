/**
 * The legacy pacing plan records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy pacing plan is in its life cycle. */
export type LegacyPacingPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy pacing plan. Its code is unique within a tenant. */
export class LegacyPacingPlan {
  code: string;
  label: string;
  capacity: number;
  description: string;
  ownerId: string;
  score: number;
  ceiling: number;
  segment: string;
  budget: number;
  currency: string;
  status: LegacyPacingPlanStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    description: string,
    ownerId: string,
    score: number,
    ceiling: number,
    segment: string,
    budget: number,
    currency: string,
    status: LegacyPacingPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.description = description;
    this.ownerId = ownerId;
    this.score = score;
    this.ceiling = ceiling;
    this.segment = segment;
    this.budget = budget;
    this.currency = currency;
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

  canMoveTo(next: LegacyPacingPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: LegacyPacingPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy pacing plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy pacing plan"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.ceiling * this.score * 100) / 100;
  }

  copy(): LegacyPacingPlan {
    return new LegacyPacingPlan(
      this.code,
      this.label,
      this.capacity,
      this.description,
      this.ownerId,
      this.score,
      this.ceiling,
      this.segment,
      this.budget,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy pacing plan in status idle. */
export function newLegacyPacingPlan(code: string, label: string): LegacyPacingPlan {
  return new LegacyPacingPlan(code, label, 0, "", "", 0, 0, "", 0, "", "idle");
}
