import * as text from "../../../../kit/text.js";

/** Where a model score is in its life cycle. */
export type ModelScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A model score as the model team keeps it. */
export class ModelScore {
  code: string;
  label: string;
  createdAt: number;
  graceDays: number;
  sequence: number;
  margin: number;
  threshold: number;
  status: ModelScoreStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    graceDays: number,
    sequence: number,
    margin: number,
    threshold: number,
    status: ModelScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.margin = margin;
    this.threshold = threshold;
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

  canMoveTo(next: ModelScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ModelScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"model score"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.threshold * this.sequence * 100) / 100;
  }

  copy(): ModelScore {
    return new ModelScore(
      this.code,
      this.label,
      this.createdAt,
      this.graceDays,
      this.sequence,
      this.margin,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a model score in status proposed. */
export function newModelScore(code: string, label: string): ModelScore {
  return new ModelScore(code, label, 0, 0, 0, 0, 0, "proposed");
}
