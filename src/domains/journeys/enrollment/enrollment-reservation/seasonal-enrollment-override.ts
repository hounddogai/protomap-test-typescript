import * as text from "../../../../kit/text.js";

/** Where a seasonal enrollment override is in its life cycle. */
export type SeasonalEnrollmentOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a seasonal enrollment override and its current status. */
export class SeasonalEnrollmentOverride {
  code: string;
  label: string;
  minimum: number;
  variant: string;
  archived: boolean;
  status: SeasonalEnrollmentOverrideStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    variant: string,
    archived: boolean,
    status: SeasonalEnrollmentOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.variant = variant;
    this.archived = archived;
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

  canMoveTo(next: SeasonalEnrollmentOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalEnrollmentOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal enrollment override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): SeasonalEnrollmentOverride {
    return new SeasonalEnrollmentOverride(
      this.code,
      this.label,
      this.minimum,
      this.variant,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal enrollment override in status new. */
export function newSeasonalEnrollmentOverride(code: string, label: string): SeasonalEnrollmentOverride {
  return new SeasonalEnrollmentOverride(code, label, 0, "", false, "new");
}
