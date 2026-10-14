import * as text from "../../../../kit/text.js";

/** Where a streak exception is in its life cycle. */
export type StreakExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A streak exception. Its code is unique within a tenant. */
export class StreakException {
  code: string;
  name: string;
  campaignRef: string;
  score: number;
  summary: string;
  batchSize: number;
  endsAt: number;
  sequence: number;
  status: StreakExceptionStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    score: number,
    summary: string,
    batchSize: number,
    endsAt: number,
    sequence: number,
    status: StreakExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.score = score;
    this.summary = summary;
    this.batchSize = batchSize;
    this.endsAt = endsAt;
    this.sequence = sequence;
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

  canMoveTo(next: StreakExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: StreakExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.sequence * this.endsAt * 100) / 100;
  }

  copy(): StreakException {
    return new StreakException(
      this.code,
      this.name,
      this.campaignRef,
      this.score,
      this.summary,
      this.batchSize,
      this.endsAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a streak exception in status open. */
export function newStreakException(code: string, name: string): StreakException {
  return new StreakException(code, name, "", 0, "", 0, 0, 0, "open");
}
