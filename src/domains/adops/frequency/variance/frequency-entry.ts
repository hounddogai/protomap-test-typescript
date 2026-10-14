import * as text from "../../../../kit/text.js";

/** Where a frequency entry is in its life cycle. */
export type FrequencyEntryStatus = "created" | "validated" | "published" | "retired";

/** A frequency entry. Its code is unique within a tenant. */
export class FrequencyEntry {
  code: string;
  label: string;
  visible: boolean;
  externalRef: string;
  threshold: number;
  active: boolean;
  reviewer: string;
  cohort: string;
  ceiling: number;
  status: FrequencyEntryStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    externalRef: string,
    threshold: number,
    active: boolean,
    reviewer: string,
    cohort: string,
    ceiling: number,
    status: FrequencyEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.active = active;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.ceiling = ceiling;
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

  canMoveTo(next: FrequencyEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.ceiling * this.threshold * 100) / 100;
  }

  copy(): FrequencyEntry {
    return new FrequencyEntry(
      this.code,
      this.label,
      this.visible,
      this.externalRef,
      this.threshold,
      this.active,
      this.reviewer,
      this.cohort,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a frequency entry in status created. */
export function newFrequencyEntry(code: string, label: string): FrequencyEntry {
  return new FrequencyEntry(code, label, false, "", 0, false, "", "", 0, "created");
}
