/**
 * The tiered pacing adjustment records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered pacing adjustment is in its life cycle. */
export type TieredPacingAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered pacing adjustment as the pacing team keeps it. */
export class TieredPacingAdjustment {
  code: string;
  label: string;
  budget: number;
  visible: boolean;
  name: string;
  status: TieredPacingAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    visible: boolean,
    name: string,
    status: TieredPacingAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.visible = visible;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredPacingAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPacingAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered pacing adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered pacing adjustment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): TieredPacingAdjustment {
    return new TieredPacingAdjustment(this.code, this.label, this.budget, this.visible, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered pacing adjustment in status new. */
export function newTieredPacingAdjustment(code: string, label: string): TieredPacingAdjustment {
  return new TieredPacingAdjustment(code, label, 0, false, "", "new");
}
