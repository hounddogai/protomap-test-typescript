/**
 * The deflection batch records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection batch is in its life cycle. */
export type DeflectionBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** One deflection batch, with what the planners need to act on it. */
export class DeflectionBatch {
  code: string;
  name: string;
  archived: boolean;
  cohort: string;
  utmSource: string;
  revision: number;
  journeyId: string;
  status: DeflectionBatchStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    cohort: string,
    utmSource: string,
    revision: number,
    journeyId: string,
    status: DeflectionBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.revision = revision;
    this.journeyId = journeyId;
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

  canMoveTo(next: DeflectionBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"deflection batch"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): DeflectionBatch {
    return new DeflectionBatch(
      this.code,
      this.name,
      this.archived,
      this.cohort,
      this.utmSource,
      this.revision,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a deflection batch in status new. */
export function newDeflectionBatch(code: string, name: string): DeflectionBatch {
  return new DeflectionBatch(code, name, false, "", "", 0, "", "new");
}
