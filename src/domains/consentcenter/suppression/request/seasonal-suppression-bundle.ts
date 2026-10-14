import * as text from "../../../../kit/text.js";

/** Where a seasonal suppression bundle is in its life cycle. */
export type SeasonalSuppressionBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a seasonal suppression bundle and its current status. */
export class SeasonalSuppressionBundle {
  code: string;
  label: string;
  segment: string;
  cost: number;
  weight: number;
  pinned: boolean;
  rate: number;
  margin: number;
  durationMinutes: number;
  status: SeasonalSuppressionBundleStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    cost: number,
    weight: number,
    pinned: boolean,
    rate: number,
    margin: number,
    durationMinutes: number,
    status: SeasonalSuppressionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.cost = cost;
    this.weight = weight;
    this.pinned = pinned;
    this.rate = rate;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalSuppressionBundleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalSuppressionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal suppression bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round(this.margin * this.durationMinutes * 100) / 100;
  }

  copy(): SeasonalSuppressionBundle {
    return new SeasonalSuppressionBundle(
      this.code,
      this.label,
      this.segment,
      this.cost,
      this.weight,
      this.pinned,
      this.rate,
      this.margin,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal suppression bundle in status open. */
export function newSeasonalSuppressionBundle(code: string, label: string): SeasonalSuppressionBundle {
  return new SeasonalSuppressionBundle(code, label, "", 0, 0, false, 0, 0, 0, "open");
}
