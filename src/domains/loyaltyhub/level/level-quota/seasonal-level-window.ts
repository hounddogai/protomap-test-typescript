import * as text from "../../../../kit/text.js";

/** Where a seasonal level window is in its life cycle. */
export type SeasonalLevelWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal level window. Its code is unique within a tenant. */
export class SeasonalLevelWindow {
  code: string;
  name: string;
  margin: number;
  amount: number;
  startsAt: number;
  maximum: number;
  endsAt: number;
  cohort: string;
  budget: number;
  title: string;
  status: SeasonalLevelWindowStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    amount: number,
    startsAt: number,
    maximum: number,
    endsAt: number,
    cohort: string,
    budget: number,
    title: string,
    status: SeasonalLevelWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.amount = amount;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.budget = budget;
    this.title = title;
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

  canMoveTo(next: SeasonalLevelWindowStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalLevelWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal level window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt - this.budget) * 100) / 100;
  }

  copy(): SeasonalLevelWindow {
    return new SeasonalLevelWindow(
      this.code,
      this.name,
      this.margin,
      this.amount,
      this.startsAt,
      this.maximum,
      this.endsAt,
      this.cohort,
      this.budget,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal level window in status new. */
export function newSeasonalLevelWindow(code: string, name: string): SeasonalLevelWindow {
  return new SeasonalLevelWindow(code, name, 0, 0, 0, 0, 0, "", 0, "", "new");
}
