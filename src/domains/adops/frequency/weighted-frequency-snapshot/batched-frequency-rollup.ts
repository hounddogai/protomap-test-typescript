import * as text from "../../../../kit/text.js";

/** Where a batched frequency rollup is in its life cycle. */
export type BatchedFrequencyRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched frequency rollup, with what the planners need to act on it. */
export class BatchedFrequencyRollup {
  code: string;
  label: string;
  channel: string;
  frequencyCap: number;
  campaignRef: string;
  description: string;
  openRate: number;
  status: BatchedFrequencyRollupStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    frequencyCap: number,
    campaignRef: string,
    description: string,
    openRate: number,
    status: BatchedFrequencyRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.frequencyCap = frequencyCap;
    this.campaignRef = campaignRef;
    this.description = description;
    this.openRate = openRate;
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

  canMoveTo(next: BatchedFrequencyRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedFrequencyRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched frequency rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched frequency rollup"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.frequencyCap + this.openRate) * 100) / 100;
  }

  copy(): BatchedFrequencyRollup {
    return new BatchedFrequencyRollup(
      this.code,
      this.label,
      this.channel,
      this.frequencyCap,
      this.campaignRef,
      this.description,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched frequency rollup in status planned. */
export function newBatchedFrequencyRollup(code: string, label: string): BatchedFrequencyRollup {
  return new BatchedFrequencyRollup(code, label, "", 0, "", "", 0, "planned");
}
