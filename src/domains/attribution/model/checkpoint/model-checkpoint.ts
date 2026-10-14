/**
 * The model checkpoint records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model checkpoint is in its life cycle. */
export type ModelCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A model checkpoint as the model team keeps it. */
export class ModelCheckpoint {
  code: string;
  label: string;
  timezone: string;
  cohort: string;
  reviewer: string;
  sendAt: number;
  notes: string;
  status: ModelCheckpointStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    cohort: string,
    reviewer: string,
    sendAt: number,
    notes: string,
    status: ModelCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.sendAt = sendAt;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ModelCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"model checkpoint"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): ModelCheckpoint {
    return new ModelCheckpoint(
      this.code,
      this.label,
      this.timezone,
      this.cohort,
      this.reviewer,
      this.sendAt,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a model checkpoint in status open. */
export function newModelCheckpoint(code: string, label: string): ModelCheckpoint {
  return new ModelCheckpoint(code, label, "", "", "", 0, "", "open");
}
