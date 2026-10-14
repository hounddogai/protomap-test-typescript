import * as text from "../../../../kit/text.js";

/** Where a approval metric is in its life cycle. */
export type ApprovalMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A approval metric. Its code is unique within a tenant. */
export class ApprovalMetric {
  code: string;
  label: string;
  cohort: string;
  attributes: Map<string, string>;
  graceDays: number;
  timezone: string;
  campaignRef: string;
  status: ApprovalMetricStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    attributes: Map<string, string>,
    graceDays: number,
    timezone: string,
    campaignRef: string,
    status: ApprovalMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.attributes = attributes;
    this.graceDays = graceDays;
    this.timezone = timezone;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ApprovalMetricStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): ApprovalMetric {
    return new ApprovalMetric(
      this.code,
      this.label,
      this.cohort,
      this.attributes,
      this.graceDays,
      this.timezone,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a approval metric in status open. */
export function newApprovalMetric(code: string, label: string): ApprovalMetric {
  return new ApprovalMetric(code, label, "", new Map<string, string>(), 0, "", "", "open");
}
