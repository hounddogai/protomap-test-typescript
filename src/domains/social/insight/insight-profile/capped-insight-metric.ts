import * as text from "../../../../kit/text.js";

/** Where a capped insight metric is in its life cycle. */
export type CappedInsightMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped insight metric. Its code is unique within a tenant. */
export class CappedInsightMetric {
  code: string;
  label: string;
  archived: boolean;
  active: boolean;
  segment: string;
  attempts: number;
  status: CappedInsightMetricStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    active: boolean,
    segment: string,
    attempts: number,
    status: CappedInsightMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.active = active;
    this.segment = segment;
    this.attempts = attempts;
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

  canMoveTo(next: CappedInsightMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: CappedInsightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped insight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): CappedInsightMetric {
    return new CappedInsightMetric(
      this.code,
      this.label,
      this.archived,
      this.active,
      this.segment,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a capped insight metric in status proposed. */
export function newCappedInsightMetric(code: string, label: string): CappedInsightMetric {
  return new CappedInsightMetric(code, label, false, false, "", 0, "proposed");
}
