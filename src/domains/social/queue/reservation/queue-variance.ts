import * as text from "../../../../kit/text.js";

/** Where a queue variance is in its life cycle. */
export type QueueVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a queue variance and its current status. */
export class QueueVariance {
  code: string;
  label: string;
  cohort: string;
  notes: string;
  title: string;
  ceiling: number;
  batchSize: number;
  tags: string[];
  journeyId: string;
  phone: string;
  status: QueueVarianceStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    notes: string,
    title: string,
    ceiling: number,
    batchSize: number,
    tags: string[],
    journeyId: string,
    phone: string,
    status: QueueVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.notes = notes;
    this.title = title;
    this.ceiling = ceiling;
    this.batchSize = batchSize;
    this.tags = tags;
    this.journeyId = journeyId;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: QueueVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"queue variance"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.batchSize + this.ceiling) * 100) / 100;
  }

  copy(): QueueVariance {
    return new QueueVariance(
      this.code,
      this.label,
      this.cohort,
      this.notes,
      this.title,
      this.ceiling,
      this.batchSize,
      this.tags,
      this.journeyId,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a queue variance in status proposed. */
export function newQueueVariance(code: string, label: string): QueueVariance {
  return new QueueVariance(code, label, "", "", "", 0, 0, [], "", "", "proposed");
}
