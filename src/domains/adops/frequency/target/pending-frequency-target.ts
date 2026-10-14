/**
 * The pending frequency target records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending frequency target is in its life cycle. */
export type PendingFrequencyTargetStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending frequency target and its current status. */
export class PendingFrequencyTarget {
  code: string;
  title: string;
  approved: boolean;
  margin: number;
  variant: string;
  cost: number;
  segment: string;
  status: PendingFrequencyTargetStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    margin: number,
    variant: string,
    cost: number,
    segment: string,
    status: PendingFrequencyTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.margin = margin;
    this.variant = variant;
    this.cost = cost;
    this.segment = segment;
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

  canMoveTo(next: PendingFrequencyTargetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingFrequencyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending frequency target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedExposure(): number {
    return Math.round((this.cost - this.margin) * 100) / 100;
  }

  copy(): PendingFrequencyTarget {
    return new PendingFrequencyTarget(
      this.code,
      this.title,
      this.approved,
      this.margin,
      this.variant,
      this.cost,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending frequency target in status created. */
export function newPendingFrequencyTarget(code: string, title: string): PendingFrequencyTarget {
  return new PendingFrequencyTarget(code, title, false, 0, "", 0, "", "created");
}
