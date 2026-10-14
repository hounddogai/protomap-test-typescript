import * as text from "../../../../kit/text.js";

/** Where a manual pacing exception is in its life cycle. */
export type ManualPacingExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual pacing exception and its current status. */
export class ManualPacingException {
  code: string;
  title: string;
  locale: string;
  cost: number;
  reviewer: string;
  rate: number;
  journeyId: string;
  createdAt: number;
  status: ManualPacingExceptionStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    cost: number,
    reviewer: string,
    rate: number,
    journeyId: string,
    createdAt: number,
    status: ManualPacingExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.cost = cost;
    this.reviewer = reviewer;
    this.rate = rate;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
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

  canMoveTo(next: ManualPacingExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPacingExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual pacing exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round((this.cost - this.createdAt) * 100) / 100;
  }

  copy(): ManualPacingException {
    return new ManualPacingException(
      this.code,
      this.title,
      this.locale,
      this.cost,
      this.reviewer,
      this.rate,
      this.journeyId,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual pacing exception in status planned. */
export function newManualPacingException(code: string, title: string): ManualPacingException {
  return new ManualPacingException(code, title, "", 0, "", 0, "", 0, "planned");
}
