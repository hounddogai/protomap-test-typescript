import * as text from "../../../../kit/text.js";

/** Where a strict enrollment summary is in its life cycle. */
export type StrictEnrollmentSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One strict enrollment summary, with what the planners need to act on it. */
export class StrictEnrollmentSummary {
  code: string;
  title: string;
  description: string;
  minimum: number;
  updatedAt: number;
  conversionRate: number;
  archived: boolean;
  externalRef: string;
  status: StrictEnrollmentSummaryStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    minimum: number,
    updatedAt: number,
    conversionRate: number,
    archived: boolean,
    externalRef: string,
    status: StrictEnrollmentSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictEnrollmentSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictEnrollmentSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict enrollment summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"strict enrollment summary"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.conversionRate * this.updatedAt * 100) / 100;
  }

  copy(): StrictEnrollmentSummary {
    return new StrictEnrollmentSummary(
      this.code,
      this.title,
      this.description,
      this.minimum,
      this.updatedAt,
      this.conversionRate,
      this.archived,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict enrollment summary in status draft. */
export function newStrictEnrollmentSummary(code: string, title: string): StrictEnrollmentSummary {
  return new StrictEnrollmentSummary(code, title, "", 0, 0, 0, false, "", "draft");
}
