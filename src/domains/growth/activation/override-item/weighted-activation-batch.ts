import * as text from "../../../../kit/text.js";

/** Where a weighted activation batch is in its life cycle. */
export type WeightedActivationBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted activation batch. Its code is unique within a tenant. */
export class WeightedActivationBatch {
  code: string;
  name: string;
  score: number;
  title: string;
  minimum: number;
  windowDays: number;
  audienceId: string;
  quantity: number;
  createdAt: number;
  budget: number;
  segment: string;
  status: WeightedActivationBatchStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    title: string,
    minimum: number,
    windowDays: number,
    audienceId: string,
    quantity: number,
    createdAt: number,
    budget: number,
    segment: string,
    status: WeightedActivationBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.title = title;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.budget = budget;
    this.segment = segment;
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

  canMoveTo(next: WeightedActivationBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedActivationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted activation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted activation batch"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.quantity + this.budget) * 100) / 100;
  }

  copy(): WeightedActivationBatch {
    return new WeightedActivationBatch(
      this.code,
      this.name,
      this.score,
      this.title,
      this.minimum,
      this.windowDays,
      this.audienceId,
      this.quantity,
      this.createdAt,
      this.budget,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted activation batch in status new. */
export function newWeightedActivationBatch(code: string, name: string): WeightedActivationBatch {
  return new WeightedActivationBatch(code, name, 0, "", 0, 0, "", 0, 0, 0, "", "new");
}
