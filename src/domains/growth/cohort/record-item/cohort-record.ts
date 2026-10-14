/**
 * The cohort record records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort record is in its life cycle. */
export type CohortRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a cohort record and its current status. */
export class CohortRecord {
  code: string;
  label: string;
  visible: boolean;
  attributes: Map<string, string>;
  archived: boolean;
  tags: string[];
  summary: string;
  description: string;
  budget: number;
  status: CohortRecordStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    attributes: Map<string, string>,
    archived: boolean,
    tags: string[],
    summary: string,
    description: string,
    budget: number,
    status: CohortRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.attributes = attributes;
    this.archived = archived;
    this.tags = tags;
    this.summary = summary;
    this.description = description;
    this.budget = budget;
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

  canMoveTo(next: CohortRecordStatus): boolean {
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"cohort record"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): CohortRecord {
    return new CohortRecord(
      this.code,
      this.label,
      this.visible,
      this.attributes,
      this.archived,
      this.tags,
      this.summary,
      this.description,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a cohort record in status proposed. */
export function newCohortRecord(code: string, label: string): CohortRecord {
  return new CohortRecord(code, label, false, new Map<string, string>(), false, [], "", "", 0, "proposed");
}
