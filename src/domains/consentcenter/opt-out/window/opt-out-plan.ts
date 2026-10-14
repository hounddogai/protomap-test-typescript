import * as text from "../../../../kit/text.js";

/** Where a opt out plan is in its life cycle. */
export type OptOutPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One opt out plan, with what the planners need to act on it. */
export class OptOutPlan {
  code: string;
  name: string;
  label: string;
  revision: number;
  segment: string;
  cohort: string;
  floorValue: number;
  source: string;
  batchSize: number;
  currency: string;
  channel: string;
  status: OptOutPlanStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    revision: number,
    segment: string,
    cohort: string,
    floorValue: number,
    source: string,
    batchSize: number,
    currency: string,
    channel: string,
    status: OptOutPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.revision = revision;
    this.segment = segment;
    this.cohort = cohort;
    this.floorValue = floorValue;
    this.source = source;
    this.batchSize = batchSize;
    this.currency = currency;
    this.channel = channel;
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

  canMoveTo(next: OptOutPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: OptOutPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.floorValue + this.revision) * 100) / 100;
  }

  copy(): OptOutPlan {
    return new OptOutPlan(
      this.code,
      this.name,
      this.label,
      this.revision,
      this.segment,
      this.cohort,
      this.floorValue,
      this.source,
      this.batchSize,
      this.currency,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a opt out plan in status proposed. */
export function newOptOutPlan(code: string, name: string): OptOutPlan {
  return new OptOutPlan(code, name, "", 0, "", "", 0, "", 0, "", "", "proposed");
}
