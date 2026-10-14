import * as text from "../../../../kit/text.js";

/** Where a strict insight request is in its life cycle. */
export type StrictInsightRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict insight request and its current status. */
export class StrictInsightRequest {
  code: string;
  title: string;
  frequencyCap: number;
  maximum: number;
  expiresAt: number;
  status: StrictInsightRequestStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    maximum: number,
    expiresAt: number,
    status: StrictInsightRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictInsightRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictInsightRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict insight request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netExposure(): number {
    return Math.round((this.frequencyCap + this.maximum) * 100) / 100;
  }

  copy(): StrictInsightRequest {
    return new StrictInsightRequest(
      this.code,
      this.title,
      this.frequencyCap,
      this.maximum,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict insight request in status new. */
export function newStrictInsightRequest(code: string, title: string): StrictInsightRequest {
  return new StrictInsightRequest(code, title, 0, 0, 0, "new");
}
