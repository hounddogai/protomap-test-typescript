import * as text from "../../../../kit/text.js";

/** Where a batched exit rule mapping is in its life cycle. */
export type BatchedExitRuleMappingStatus = "created" | "validated" | "published" | "retired";

/** A batched exit rule mapping as the exit rule team keeps it. */
export class BatchedExitRuleMapping {
  code: string;
  label: string;
  weight: number;
  locale: string;
  reviewer: string;
  openRate: number;
  status: BatchedExitRuleMappingStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    locale: string,
    reviewer: string,
    openRate: number,
    status: BatchedExitRuleMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.locale = locale;
    this.reviewer = reviewer;
    this.openRate = openRate;
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

  canMoveTo(next: BatchedExitRuleMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
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

  moveTo(next: BatchedExitRuleMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched exit rule mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.weight + this.openRate) * 100) / 100;
  }

  copy(): BatchedExitRuleMapping {
    return new BatchedExitRuleMapping(
      this.code,
      this.label,
      this.weight,
      this.locale,
      this.reviewer,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched exit rule mapping in status created. */
export function newBatchedExitRuleMapping(code: string, label: string): BatchedExitRuleMapping {
  return new BatchedExitRuleMapping(code, label, 0, "", "", 0, "created");
}
