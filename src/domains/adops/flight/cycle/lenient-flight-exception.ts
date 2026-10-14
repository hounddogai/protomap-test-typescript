import * as text from "../../../../kit/text.js";

/** Where a lenient flight exception is in its life cycle. */
export type LenientFlightExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient flight exception. Its code is unique within a tenant. */
export class LenientFlightException {
  code: string;
  title: string;
  score: number;
  updatedAt: number;
  region: string;
  ratio: number;
  status: LenientFlightExceptionStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    updatedAt: number,
    region: string,
    ratio: number,
    status: LenientFlightExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.updatedAt = updatedAt;
    this.region = region;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientFlightExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientFlightExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient flight exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.ratio - this.updatedAt) * 100) / 100;
  }

  copy(): LenientFlightException {
    return new LenientFlightException(
      this.code,
      this.title,
      this.score,
      this.updatedAt,
      this.region,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient flight exception in status planned. */
export function newLenientFlightException(code: string, title: string): LenientFlightException {
  return new LenientFlightException(code, title, 0, 0, "", 0, "planned");
}
