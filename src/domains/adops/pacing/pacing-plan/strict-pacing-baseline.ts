import * as text from "../../../../kit/text.js";

/** Where a strict pacing baseline is in its life cycle. */
export type StrictPacingBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a strict pacing baseline and its current status. */
export class StrictPacingBaseline {
  code: string;
  label: string;
  externalRef: string;
  priority: number;
  budget: number;
  channel: string;
  status: StrictPacingBaselineStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    priority: number,
    budget: number,
    channel: string,
    status: StrictPacingBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.priority = priority;
    this.budget = budget;
    this.channel = channel;
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

  canMoveTo(next: StrictPacingBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StrictPacingBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict pacing baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round(this.budget * this.priority * 100) / 100;
  }

  copy(): StrictPacingBaseline {
    return new StrictPacingBaseline(
      this.code,
      this.label,
      this.externalRef,
      this.priority,
      this.budget,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict pacing baseline in status proposed. */
export function newStrictPacingBaseline(code: string, label: string): StrictPacingBaseline {
  return new StrictPacingBaseline(code, label, "", 0, 0, "", "proposed");
}
