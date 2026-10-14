import * as text from "../../../../kit/text.js";

/** Where a weighted cohort exception is in its life cycle. */
export type WeightedCohortExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted cohort exception. Its code is unique within a tenant. */
export class WeightedCohortException {
  code: string;
  label: string;
  channel: string;
  cost: number;
  utmSource: string;
  description: string;
  sequence: number;
  status: WeightedCohortExceptionStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    cost: number,
    utmSource: string,
    description: string,
    sequence: number,
    status: WeightedCohortExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.cost = cost;
    this.utmSource = utmSource;
    this.description = description;
    this.sequence = sequence;
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

  canMoveTo(next: WeightedCohortExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedCohortExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted cohort exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.cost * this.sequence * 100) / 100;
  }

  copy(): WeightedCohortException {
    return new WeightedCohortException(
      this.code,
      this.label,
      this.channel,
      this.cost,
      this.utmSource,
      this.description,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted cohort exception in status new. */
export function newWeightedCohortException(code: string, label: string): WeightedCohortException {
  return new WeightedCohortException(code, label, "", 0, "", "", 0, "new");
}
