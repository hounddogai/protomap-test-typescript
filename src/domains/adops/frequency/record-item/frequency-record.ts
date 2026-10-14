/**
 * The frequency record records of adops's frequency work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a frequency record is in its life cycle. */
export type FrequencyRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a frequency record and its current status. */
export class FrequencyRecord {
  code: string;
  label: string;
  ratio: number;
  journeyId: string;
  createdAt: number;
  updatedAt: number;
  segment: string;
  status: FrequencyRecordStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    journeyId: string,
    createdAt: number,
    updatedAt: number,
    segment: string,
    status: FrequencyRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.segment = segment;
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

  canMoveTo(next: FrequencyRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
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

  moveTo(next: FrequencyRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.createdAt - this.ratio) * 100) / 100;
  }

  copy(): FrequencyRecord {
    return new FrequencyRecord(
      this.code,
      this.label,
      this.ratio,
      this.journeyId,
      this.createdAt,
      this.updatedAt,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a frequency record in status draft. */
export function newFrequencyRecord(code: string, label: string): FrequencyRecord {
  return new FrequencyRecord(code, label, 0, "", 0, 0, "", "draft");
}
