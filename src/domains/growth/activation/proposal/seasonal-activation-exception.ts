import * as text from "../../../../kit/text.js";

/** Where a seasonal activation exception is in its life cycle. */
export type SeasonalActivationExceptionStatus = "created" | "validated" | "published" | "retired";

/** The record of a seasonal activation exception and its current status. */
export class SeasonalActivationException {
  code: string;
  title: string;
  cohort: string;
  endsAt: number;
  active: boolean;
  startsAt: number;
  score: number;
  label: string;
  status: SeasonalActivationExceptionStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    endsAt: number,
    active: boolean,
    startsAt: number,
    score: number,
    label: string,
    status: SeasonalActivationExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.endsAt = endsAt;
    this.active = active;
    this.startsAt = startsAt;
    this.score = score;
    this.label = label;
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

  canMoveTo(next: SeasonalActivationExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalActivationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal activation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.endsAt + this.startsAt) * 100) / 100;
  }

  copy(): SeasonalActivationException {
    return new SeasonalActivationException(
      this.code,
      this.title,
      this.cohort,
      this.endsAt,
      this.active,
      this.startsAt,
      this.score,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal activation exception in status created. */
export function newSeasonalActivationException(code: string, title: string): SeasonalActivationException {
  return new SeasonalActivationException(code, title, "", 0, false, 0, 0, "", "created");
}
