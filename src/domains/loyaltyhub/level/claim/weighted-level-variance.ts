import * as text from "../../../../kit/text.js";

/** Where a weighted level variance is in its life cycle. */
export type WeightedLevelVarianceStatus = "created" | "validated" | "published" | "retired";

/** One weighted level variance, with what the planners need to act on it. */
export class WeightedLevelVariance {
  code: string;
  label: string;
  batchSize: number;
  audienceId: string;
  ownerId: string;
  status: WeightedLevelVarianceStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    audienceId: string,
    ownerId: string,
    status: WeightedLevelVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.ownerId = ownerId;
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

  canMoveTo(next: WeightedLevelVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: WeightedLevelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted level variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): WeightedLevelVariance {
    return new WeightedLevelVariance(this.code, this.label, this.batchSize, this.audienceId, this.ownerId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted level variance in status created. */
export function newWeightedLevelVariance(code: string, label: string): WeightedLevelVariance {
  return new WeightedLevelVariance(code, label, 0, "", "", "created");
}
