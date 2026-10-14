/**
 * The wait batch records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait batch is in its life cycle. */
export type WaitBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a wait batch and its current status. */
export class WaitBatch {
  code: string;
  title: string;
  category: string;
  name: string;
  graceDays: number;
  country: string;
  budget: number;
  batchSize: number;
  cohort: string;
  utmSource: string;
  phone: string;
  status: WaitBatchStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    name: string,
    graceDays: number,
    country: string,
    budget: number,
    batchSize: number,
    cohort: string,
    utmSource: string,
    phone: string,
    status: WaitBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.name = name;
    this.graceDays = graceDays;
    this.country = country;
    this.budget = budget;
    this.batchSize = batchSize;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.phone = phone;
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

  canMoveTo(next: WaitBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget + this.batchSize) * 100) / 100;
  }

  copy(): WaitBatch {
    return new WaitBatch(
      this.code,
      this.title,
      this.category,
      this.name,
      this.graceDays,
      this.country,
      this.budget,
      this.batchSize,
      this.cohort,
      this.utmSource,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a wait batch in status planned. */
export function newWaitBatch(code: string, title: string): WaitBatch {
  return new WaitBatch(code, title, "", "", 0, "", 0, 0, "", "", "", "planned");
}
