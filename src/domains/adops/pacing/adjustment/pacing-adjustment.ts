/**
 * The pacing adjustment records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing adjustment is in its life cycle. */
export type PacingAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pacing adjustment as the pacing team keeps it. */
export class PacingAdjustment {
  code: string;
  title: string;
  name: string;
  unit: string;
  quantity: number;
  durationMinutes: number;
  status: PacingAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    unit: string,
    quantity: number,
    durationMinutes: number,
    status: PacingAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.unit = unit;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pacing adjustment"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.quantity + this.durationMinutes) * 100) / 100;
  }

  copy(): PacingAdjustment {
    return new PacingAdjustment(
      this.code,
      this.title,
      this.name,
      this.unit,
      this.quantity,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pacing adjustment in status draft. */
export function newPacingAdjustment(code: string, title: string): PacingAdjustment {
  return new PacingAdjustment(code, title, "", "", 0, 0, "draft");
}
