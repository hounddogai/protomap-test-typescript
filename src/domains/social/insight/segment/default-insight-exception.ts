import * as text from "../../../../kit/text.js";

/** Where a default insight exception is in its life cycle. */
export type DefaultInsightExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One default insight exception, with what the planners need to act on it. */
export class DefaultInsightException {
  code: string;
  title: string;
  sequence: number;
  summary: string;
  batchSize: number;
  sendAt: number;
  status: DefaultInsightExceptionStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    summary: string,
    batchSize: number,
    sendAt: number,
    status: DefaultInsightExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.summary = summary;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
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

  canMoveTo(next: DefaultInsightExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
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

  moveTo(next: DefaultInsightExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default insight exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round((this.batchSize + this.sendAt) * 100) / 100;
  }

  copy(): DefaultInsightException {
    return new DefaultInsightException(
      this.code,
      this.title,
      this.sequence,
      this.summary,
      this.batchSize,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default insight exception in status open. */
export function newDefaultInsightException(code: string, title: string): DefaultInsightException {
  return new DefaultInsightException(code, title, 0, "", 0, 0, "open");
}
