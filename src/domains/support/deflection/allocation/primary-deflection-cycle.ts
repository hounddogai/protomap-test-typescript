import * as text from "../../../../kit/text.js";

/** Where a primary deflection cycle is in its life cycle. */
export type PrimaryDeflectionCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary deflection cycle and its current status. */
export class PrimaryDeflectionCycle {
  code: string;
  label: string;
  channel: string;
  campaignRef: string;
  budget: number;
  conversionRate: number;
  ratio: number;
  status: PrimaryDeflectionCycleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    campaignRef: string,
    budget: number,
    conversionRate: number,
    ratio: number,
    status: PrimaryDeflectionCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.ratio = ratio;
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

  canMoveTo(next: PrimaryDeflectionCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryDeflectionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary deflection cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round(this.ratio * this.conversionRate * 100) / 100;
  }

  copy(): PrimaryDeflectionCycle {
    return new PrimaryDeflectionCycle(
      this.code,
      this.label,
      this.channel,
      this.campaignRef,
      this.budget,
      this.conversionRate,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary deflection cycle in status new. */
export function newPrimaryDeflectionCycle(code: string, label: string): PrimaryDeflectionCycle {
  return new PrimaryDeflectionCycle(code, label, "", "", 0, 0, 0, "new");
}
