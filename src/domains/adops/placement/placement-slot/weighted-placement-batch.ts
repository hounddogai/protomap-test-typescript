import * as text from "../../../../kit/text.js";

/** Where a weighted placement batch is in its life cycle. */
export type WeightedPlacementBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted placement batch and its current status. */
export class WeightedPlacementBatch {
  code: string;
  title: string;
  unit: string;
  locale: string;
  openRate: number;
  segment: string;
  frequencyCap: number;
  label: string;
  status: WeightedPlacementBatchStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    locale: string,
    openRate: number,
    segment: string,
    frequencyCap: number,
    label: string,
    status: WeightedPlacementBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.locale = locale;
    this.openRate = openRate;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.label = label;
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

  canMoveTo(next: WeightedPlacementBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "done" || next === "failed";
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

  moveTo(next: WeightedPlacementBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted placement batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round(this.frequencyCap * this.openRate * 100) / 100;
  }

  copy(): WeightedPlacementBatch {
    return new WeightedPlacementBatch(
      this.code,
      this.title,
      this.unit,
      this.locale,
      this.openRate,
      this.segment,
      this.frequencyCap,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted placement batch in status new. */
export function newWeightedPlacementBatch(code: string, title: string): WeightedPlacementBatch {
  return new WeightedPlacementBatch(code, title, "", "", 0, "", 0, "", "new");
}
