import * as text from "../../../../kit/text.js";

/** Where a fallback enrollment metric is in its life cycle. */
export type FallbackEnrollmentMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback enrollment metric and its current status. */
export class FallbackEnrollmentMetric {
  code: string;
  name: string;
  amount: number;
  updatedAt: number;
  tags: string[];
  visible: boolean;
  status: FallbackEnrollmentMetricStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    updatedAt: number,
    tags: string[],
    visible: boolean,
    status: FallbackEnrollmentMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.updatedAt = updatedAt;
    this.tags = tags;
    this.visible = visible;
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

  canMoveTo(next: FallbackEnrollmentMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackEnrollmentMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback enrollment metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.amount - this.updatedAt) * 100) / 100;
  }

  copy(): FallbackEnrollmentMetric {
    return new FallbackEnrollmentMetric(
      this.code,
      this.name,
      this.amount,
      this.updatedAt,
      this.tags,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback enrollment metric in status open. */
export function newFallbackEnrollmentMetric(code: string, name: string): FallbackEnrollmentMetric {
  return new FallbackEnrollmentMetric(code, name, 0, 0, [], false, "open");
}
