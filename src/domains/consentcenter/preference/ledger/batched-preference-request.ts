import * as text from "../../../../kit/text.js";

/** Where a batched preference request is in its life cycle. */
export type BatchedPreferenceRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched preference request. Its code is unique within a tenant. */
export class BatchedPreferenceRequest {
  code: string;
  name: string;
  rate: number;
  locale: string;
  minimum: number;
  label: string;
  status: BatchedPreferenceRequestStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    locale: string,
    minimum: number,
    label: string,
    status: BatchedPreferenceRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.locale = locale;
    this.minimum = minimum;
    this.label = label;
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

  canMoveTo(next: BatchedPreferenceRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedPreferenceRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched preference request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.rate - this.minimum) * 100) / 100;
  }

  copy(): BatchedPreferenceRequest {
    return new BatchedPreferenceRequest(
      this.code,
      this.name,
      this.rate,
      this.locale,
      this.minimum,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched preference request in status open. */
export function newBatchedPreferenceRequest(code: string, name: string): BatchedPreferenceRequest {
  return new BatchedPreferenceRequest(code, name, 0, "", 0, "", "open");
}
