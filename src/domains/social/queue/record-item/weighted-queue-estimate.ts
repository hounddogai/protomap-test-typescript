import * as text from "../../../../kit/text.js";

/** Where a weighted queue estimate is in its life cycle. */
export type WeightedQueueEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted queue estimate as the queue team keeps it. */
export class WeightedQueueEstimate {
  code: string;
  label: string;
  budget: number;
  maximum: number;
  weight: number;
  archived: boolean;
  tags: string[];
  status: WeightedQueueEstimateStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    maximum: number,
    weight: number,
    archived: boolean,
    tags: string[],
    status: WeightedQueueEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.maximum = maximum;
    this.weight = weight;
    this.archived = archived;
    this.tags = tags;
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

  canMoveTo(next: WeightedQueueEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running";
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

  moveTo(next: WeightedQueueEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted queue estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted queue estimate"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.maximum - this.weight) * 100) / 100;
  }

  copy(): WeightedQueueEstimate {
    return new WeightedQueueEstimate(
      this.code,
      this.label,
      this.budget,
      this.maximum,
      this.weight,
      this.archived,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted queue estimate in status new. */
export function newWeightedQueueEstimate(code: string, label: string): WeightedQueueEstimate {
  return new WeightedQueueEstimate(code, label, 0, 0, 0, false, [], "new");
}
