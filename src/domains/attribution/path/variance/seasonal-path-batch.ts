import * as text from "../../../../kit/text.js";

/** Where a seasonal path batch is in its life cycle. */
export type SeasonalPathBatchStatus = "created" | "validated" | "published" | "retired";

/** A seasonal path batch as the path team keeps it. */
export class SeasonalPathBatch {
  code: string;
  label: string;
  rate: number;
  limit: number;
  minimum: number;
  weight: number;
  variant: string;
  maximum: number;
  status: SeasonalPathBatchStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    limit: number,
    minimum: number,
    weight: number,
    variant: string,
    maximum: number,
    status: SeasonalPathBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.limit = limit;
    this.minimum = minimum;
    this.weight = weight;
    this.variant = variant;
    this.maximum = maximum;
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

  canMoveTo(next: SeasonalPathBatchStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalPathBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal path batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.minimum + this.limit) * 100) / 100;
  }

  copy(): SeasonalPathBatch {
    return new SeasonalPathBatch(
      this.code,
      this.label,
      this.rate,
      this.limit,
      this.minimum,
      this.weight,
      this.variant,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal path batch in status created. */
export function newSeasonalPathBatch(code: string, label: string): SeasonalPathBatch {
  return new SeasonalPathBatch(code, label, 0, 0, 0, 0, "", 0, "created");
}
