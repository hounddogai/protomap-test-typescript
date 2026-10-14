import * as text from "../../../../kit/text.js";

/** Where a seasonal touchpoint checkpoint is in its life cycle. */
export type SeasonalTouchpointCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal touchpoint checkpoint, with what the planners need to act on it. */
export class SeasonalTouchpointCheckpoint {
  code: string;
  label: string;
  description: string;
  locale: string;
  clicks: number;
  budget: number;
  ratio: number;
  status: SeasonalTouchpointCheckpointStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    locale: string,
    clicks: number,
    budget: number,
    ratio: number,
    status: SeasonalTouchpointCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.locale = locale;
    this.clicks = clicks;
    this.budget = budget;
    this.ratio = ratio;
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

  canMoveTo(next: SeasonalTouchpointCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SeasonalTouchpointCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal touchpoint checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal touchpoint checkpoint"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.ratio * this.budget * 100) / 100;
  }

  copy(): SeasonalTouchpointCheckpoint {
    return new SeasonalTouchpointCheckpoint(
      this.code,
      this.label,
      this.description,
      this.locale,
      this.clicks,
      this.budget,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal touchpoint checkpoint in status open. */
export function newSeasonalTouchpointCheckpoint(code: string, label: string): SeasonalTouchpointCheckpoint {
  return new SeasonalTouchpointCheckpoint(code, label, "", "", 0, 0, 0, "open");
}
