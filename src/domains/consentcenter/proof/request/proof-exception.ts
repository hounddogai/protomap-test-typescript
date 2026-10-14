import * as text from "../../../../kit/text.js";

/** Where a proof exception is in its life cycle. */
export type ProofExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a proof exception and its current status. */
export class ProofException {
  code: string;
  title: string;
  budget: number;
  notes: string;
  summary: string;
  archived: boolean;
  graceDays: number;
  currency: string;
  timezone: string;
  frequencyCap: number;
  status: ProofExceptionStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    notes: string,
    summary: string,
    archived: boolean,
    graceDays: number,
    currency: string,
    timezone: string,
    frequencyCap: number,
    status: ProofExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.notes = notes;
    this.summary = summary;
    this.archived = archived;
    this.graceDays = graceDays;
    this.currency = currency;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: ProofExceptionStatus): boolean {
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

  moveTo(next: ProofExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays + this.budget) * 100) / 100;
  }

  copy(): ProofException {
    return new ProofException(
      this.code,
      this.title,
      this.budget,
      this.notes,
      this.summary,
      this.archived,
      this.graceDays,
      this.currency,
      this.timezone,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof exception in status planned. */
export function newProofException(code: string, title: string): ProofException {
  return new ProofException(code, title, 0, "", "", false, 0, "", "", 0, "planned");
}
