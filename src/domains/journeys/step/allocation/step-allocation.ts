/**
 * The step allocation records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step allocation is in its life cycle. */
export type StepAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a step allocation and its current status. */
export class StepAllocation {
  code: string;
  label: string;
  tags: string[];
  locale: string;
  summary: string;
  archived: boolean;
  ownerId: string;
  quantity: number;
  status: StepAllocationStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    locale: string,
    summary: string,
    archived: boolean,
    ownerId: string,
    quantity: number,
    status: StepAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.locale = locale;
    this.summary = summary;
    this.archived = archived;
    this.ownerId = ownerId;
    this.quantity = quantity;
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

  canMoveTo(next: StepAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StepAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): StepAllocation {
    return new StepAllocation(
      this.code,
      this.label,
      this.tags,
      this.locale,
      this.summary,
      this.archived,
      this.ownerId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a step allocation in status new. */
export function newStepAllocation(code: string, label: string): StepAllocation {
  return new StepAllocation(code, label, [], "", "", false, "", 0, "new");
}
