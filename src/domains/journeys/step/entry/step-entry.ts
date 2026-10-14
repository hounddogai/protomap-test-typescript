/**
 * The step entry records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step entry is in its life cycle. */
export type StepEntryStatus = "created" | "validated" | "published" | "retired";

/** The record of a step entry and its current status. */
export class StepEntry {
  code: string;
  name: string;
  title: string;
  archived: boolean;
  summary: string;
  reviewer: string;
  maximum: number;
  utmSource: string;
  status: StepEntryStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    archived: boolean,
    summary: string,
    reviewer: string,
    maximum: number,
    utmSource: string,
    status: StepEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.archived = archived;
    this.summary = summary;
    this.reviewer = reviewer;
    this.maximum = maximum;
    this.utmSource = utmSource;
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

  canMoveTo(next: StepEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StepEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): StepEntry {
    return new StepEntry(
      this.code,
      this.name,
      this.title,
      this.archived,
      this.summary,
      this.reviewer,
      this.maximum,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a step entry in status created. */
export function newStepEntry(code: string, name: string): StepEntry {
  return new StepEntry(code, name, "", false, "", "", 0, "", "created");
}
