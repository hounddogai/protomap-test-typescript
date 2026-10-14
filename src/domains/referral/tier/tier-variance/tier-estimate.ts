import * as text from "../../../../kit/text.js";

/** Where a tier estimate is in its life cycle. */
export type TierEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a tier estimate and its current status. */
export class TierEstimate {
  code: string;
  name: string;
  maximum: number;
  revision: number;
  timezone: string;
  segment: string;
  ratio: number;
  graceDays: number;
  status: TierEstimateStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    revision: number,
    timezone: string,
    segment: string,
    ratio: number,
    graceDays: number,
    status: TierEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.revision = revision;
    this.timezone = timezone;
    this.segment = segment;
    this.ratio = ratio;
    this.graceDays = graceDays;
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

  canMoveTo(next: TierEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.revision + this.maximum) * 100) / 100;
  }

  copy(): TierEstimate {
    return new TierEstimate(
      this.code,
      this.name,
      this.maximum,
      this.revision,
      this.timezone,
      this.segment,
      this.ratio,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tier estimate in status open. */
export function newTierEstimate(code: string, name: string): TierEstimate {
  return new TierEstimate(code, name, 0, 0, "", "", 0, 0, "open");
}
