import * as text from "../../../../kit/text.js";

/** Where a batched insight exception is in its life cycle. */
export type BatchedInsightExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched insight exception, with what the planners need to act on it. */
export class BatchedInsightException {
  code: string;
  title: string;
  description: string;
  locale: string;
  priority: number;
  country: string;
  ceiling: number;
  status: BatchedInsightExceptionStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    locale: string,
    priority: number,
    country: string,
    ceiling: number,
    status: BatchedInsightExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.locale = locale;
    this.priority = priority;
    this.country = country;
    this.ceiling = ceiling;
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

  canMoveTo(next: BatchedInsightExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedInsightExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched insight exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched insight exception"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.ceiling * this.priority * 100) / 100;
  }

  copy(): BatchedInsightException {
    return new BatchedInsightException(
      this.code,
      this.title,
      this.description,
      this.locale,
      this.priority,
      this.country,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched insight exception in status open. */
export function newBatchedInsightException(code: string, title: string): BatchedInsightException {
  return new BatchedInsightException(code, title, "", "", 0, "", 0, "open");
}
