import * as text from "../../../../kit/text.js";

/** Where a scheduled cohort exception is in its life cycle. */
export type ScheduledCohortExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One scheduled cohort exception, with what the planners need to act on it. */
export class ScheduledCohortException {
  code: string;
  name: string;
  rate: number;
  endsAt: number;
  channel: string;
  description: string;
  attributes: Map<string, string>;
  active: boolean;
  maximum: number;
  label: string;
  status: ScheduledCohortExceptionStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    endsAt: number,
    channel: string,
    description: string,
    attributes: Map<string, string>,
    active: boolean,
    maximum: number,
    label: string,
    status: ScheduledCohortExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.endsAt = endsAt;
    this.channel = channel;
    this.description = description;
    this.attributes = attributes;
    this.active = active;
    this.maximum = maximum;
    this.label = label;
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

  canMoveTo(next: ScheduledCohortExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ScheduledCohortExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled cohort exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled cohort exception"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.rate + this.endsAt) * 100) / 100;
  }

  copy(): ScheduledCohortException {
    return new ScheduledCohortException(
      this.code,
      this.name,
      this.rate,
      this.endsAt,
      this.channel,
      this.description,
      this.attributes,
      this.active,
      this.maximum,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled cohort exception in status proposed. */
export function newScheduledCohortException(code: string, name: string): ScheduledCohortException {
  return new ScheduledCohortException(code, name, 0, 0, "", "", new Map<string, string>(), false, 0, "", "proposed");
}
