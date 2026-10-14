import * as text from "../../../../kit/text.js";

/** Where a tiered escalation summary is in its life cycle. */
export type TieredEscalationSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered escalation summary. Its code is unique within a tenant. */
export class TieredEscalationSummary {
  code: string;
  label: string;
  batchSize: number;
  revision: number;
  createdAt: number;
  budget: number;
  status: TieredEscalationSummaryStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    revision: number,
    createdAt: number,
    budget: number,
    status: TieredEscalationSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.revision = revision;
    this.createdAt = createdAt;
    this.budget = budget;
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

  canMoveTo(next: TieredEscalationSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredEscalationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered escalation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"tiered escalation summary"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.revision + this.budget) * 100) / 100;
  }

  copy(): TieredEscalationSummary {
    return new TieredEscalationSummary(
      this.code,
      this.label,
      this.batchSize,
      this.revision,
      this.createdAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered escalation summary in status new. */
export function newTieredEscalationSummary(code: string, label: string): TieredEscalationSummary {
  return new TieredEscalationSummary(code, label, 0, 0, 0, 0, "new");
}
