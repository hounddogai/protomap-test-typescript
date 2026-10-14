import * as text from "../../../../kit/text.js";

/** Where a model estimate is in its life cycle. */
export type ModelEstimateStatus = "created" | "validated" | "published" | "retired";

/** A model estimate. Its code is unique within a tenant. */
export class ModelEstimate {
  code: string;
  title: string;
  attempts: number;
  ratio: number;
  capacity: number;
  category: string;
  status: ModelEstimateStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    ratio: number,
    capacity: number,
    category: string,
    status: ModelEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.ratio = ratio;
    this.capacity = capacity;
    this.category = category;
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

  canMoveTo(next: ModelEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ModelEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"model estimate"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.ratio * this.attempts * 100) / 100;
  }

  copy(): ModelEstimate {
    return new ModelEstimate(
      this.code,
      this.title,
      this.attempts,
      this.ratio,
      this.capacity,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a model estimate in status created. */
export function newModelEstimate(code: string, title: string): ModelEstimate {
  return new ModelEstimate(code, title, 0, 0, 0, "", "created");
}
