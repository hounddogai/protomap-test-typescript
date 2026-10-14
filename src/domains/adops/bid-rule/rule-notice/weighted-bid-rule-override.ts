import * as text from "../../../../kit/text.js";

/** Where a weighted bid rule override is in its life cycle. */
export type WeightedBidRuleOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted bid rule override. Its code is unique within a tenant. */
export class WeightedBidRuleOverride {
  code: string;
  label: string;
  archived: boolean;
  summary: string;
  audienceId: string;
  notes: string;
  journeyId: string;
  reviewer: string;
  amount: number;
  status: WeightedBidRuleOverrideStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    summary: string,
    audienceId: string,
    notes: string,
    journeyId: string,
    reviewer: string,
    amount: number,
    status: WeightedBidRuleOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.summary = summary;
    this.audienceId = audienceId;
    this.notes = notes;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.amount = amount;
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

  canMoveTo(next: WeightedBidRuleOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedBidRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted bid rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): WeightedBidRuleOverride {
    return new WeightedBidRuleOverride(
      this.code,
      this.label,
      this.archived,
      this.summary,
      this.audienceId,
      this.notes,
      this.journeyId,
      this.reviewer,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted bid rule override in status idle. */
export function newWeightedBidRuleOverride(code: string, label: string): WeightedBidRuleOverride {
  return new WeightedBidRuleOverride(code, label, false, "", "", "", "", "", 0, "idle");
}
