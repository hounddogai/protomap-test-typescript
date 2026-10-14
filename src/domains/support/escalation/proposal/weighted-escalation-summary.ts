import * as text from "../../../../kit/text.js";

/** Where a weighted escalation summary is in its life cycle. */
export type WeightedEscalationSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted escalation summary, with what the planners need to act on it. */
export class WeightedEscalationSummary {
  code: string;
  label: string;
  graceDays: number;
  rate: number;
  revision: number;
  notes: string;
  status: WeightedEscalationSummaryStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    rate: number,
    revision: number,
    notes: string,
    status: WeightedEscalationSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.rate = rate;
    this.revision = revision;
    this.notes = notes;
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

  canMoveTo(next: WeightedEscalationSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedEscalationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.rate - this.graceDays) * 100) / 100;
  }

  copy(): WeightedEscalationSummary {
    return new WeightedEscalationSummary(
      this.code,
      this.label,
      this.graceDays,
      this.rate,
      this.revision,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted escalation summary in status new. */
export function newWeightedEscalationSummary(code: string, label: string): WeightedEscalationSummary {
  return new WeightedEscalationSummary(code, label, 0, 0, 0, "", "new");
}
