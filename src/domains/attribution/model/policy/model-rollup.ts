import * as text from "../../../../kit/text.js";

/** Where a model rollup is in its life cycle. */
export type ModelRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One model rollup, with what the planners need to act on it. */
export class ModelRollup {
  code: string;
  label: string;
  description: string;
  rate: number;
  conversionRate: number;
  startsAt: number;
  status: ModelRollupStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    rate: number,
    conversionRate: number,
    startsAt: number,
    status: ModelRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"model rollup"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.conversionRate * this.startsAt * 100) / 100;
  }

  copy(): ModelRollup {
    return new ModelRollup(
      this.code,
      this.label,
      this.description,
      this.rate,
      this.conversionRate,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a model rollup in status proposed. */
export function newModelRollup(code: string, label: string): ModelRollup {
  return new ModelRollup(code, label, "", 0, 0, 0, "proposed");
}
