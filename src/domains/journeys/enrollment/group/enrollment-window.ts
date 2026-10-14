import * as text from "../../../../kit/text.js";

/** Where a enrollment window is in its life cycle. */
export type EnrollmentWindowStatus = "created" | "validated" | "published" | "retired";

/** One enrollment window, with what the planners need to act on it. */
export class EnrollmentWindow {
  code: string;
  title: string;
  graceDays: number;
  journeyId: string;
  visible: boolean;
  expiresAt: number;
  startsAt: number;
  frequencyCap: number;
  source: string;
  batchSize: number;
  status: EnrollmentWindowStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    journeyId: string,
    visible: boolean,
    expiresAt: number,
    startsAt: number,
    frequencyCap: number,
    source: string,
    batchSize: number,
    status: EnrollmentWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.journeyId = journeyId;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.startsAt = startsAt;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentWindowStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: EnrollmentWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round(this.batchSize * this.startsAt * 100) / 100;
  }

  copy(): EnrollmentWindow {
    return new EnrollmentWindow(
      this.code,
      this.title,
      this.graceDays,
      this.journeyId,
      this.visible,
      this.expiresAt,
      this.startsAt,
      this.frequencyCap,
      this.source,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a enrollment window in status created. */
export function newEnrollmentWindow(code: string, title: string): EnrollmentWindow {
  return new EnrollmentWindow(code, title, 0, "", false, 0, 0, 0, "", 0, "created");
}
