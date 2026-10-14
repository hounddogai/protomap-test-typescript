import * as text from "../../../../kit/text.js";

/** Where a weighted sender exception is in its life cycle. */
export type WeightedSenderExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a weighted sender exception and its current status. */
export class WeightedSenderException {
  code: string;
  label: string;
  limit: number;
  startsAt: number;
  margin: number;
  frequencyCap: number;
  channel: string;
  budget: number;
  windowDays: number;
  summary: string;
  batchSize: number;
  status: WeightedSenderExceptionStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    startsAt: number,
    margin: number,
    frequencyCap: number,
    channel: string,
    budget: number,
    windowDays: number,
    summary: string,
    batchSize: number,
    status: WeightedSenderExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.startsAt = startsAt;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.budget = budget;
    this.windowDays = windowDays;
    this.summary = summary;
    this.batchSize = batchSize;
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

  canMoveTo(next: WeightedSenderExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedSenderExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted sender exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round(this.margin * this.limit * 100) / 100;
  }

  copy(): WeightedSenderException {
    return new WeightedSenderException(
      this.code,
      this.label,
      this.limit,
      this.startsAt,
      this.margin,
      this.frequencyCap,
      this.channel,
      this.budget,
      this.windowDays,
      this.summary,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted sender exception in status draft. */
export function newWeightedSenderException(code: string, label: string): WeightedSenderException {
  return new WeightedSenderException(code, label, 0, 0, 0, 0, "", 0, 0, "", 0, "draft");
}
