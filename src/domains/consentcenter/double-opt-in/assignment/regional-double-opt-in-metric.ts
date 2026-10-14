import * as text from "../../../../kit/text.js";

/** Where a regional double opt in metric is in its life cycle. */
export type RegionalDoubleOptInMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a regional double opt in metric and its current status. */
export class RegionalDoubleOptInMetric {
  code: string;
  name: string;
  contactEmail: string;
  segment: string;
  revision: number;
  windowDays: number;
  status: RegionalDoubleOptInMetricStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    segment: string,
    revision: number,
    windowDays: number,
    status: RegionalDoubleOptInMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.segment = segment;
    this.revision = revision;
    this.windowDays = windowDays;
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

  canMoveTo(next: RegionalDoubleOptInMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalDoubleOptInMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional double opt in metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.revision + this.windowDays) * 100) / 100;
  }

  copy(): RegionalDoubleOptInMetric {
    return new RegionalDoubleOptInMetric(
      this.code,
      this.name,
      this.contactEmail,
      this.segment,
      this.revision,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a regional double opt in metric in status created. */
export function newRegionalDoubleOptInMetric(code: string, name: string): RegionalDoubleOptInMetric {
  return new RegionalDoubleOptInMetric(code, name, "", "", 0, 0, "created");
}
