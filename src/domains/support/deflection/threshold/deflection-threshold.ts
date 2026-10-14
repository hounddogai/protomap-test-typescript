/**
 * The deflection threshold records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection threshold is in its life cycle. */
export type DeflectionThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A deflection threshold. Its code is unique within a tenant. */
export class DeflectionThreshold {
  code: string;
  label: string;
  priority: number;
  ceiling: number;
  visible: boolean;
  externalRef: string;
  journeyId: string;
  checksum: string;
  segment: string;
  notes: string;
  status: DeflectionThresholdStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    ceiling: number,
    visible: boolean,
    externalRef: string,
    journeyId: string,
    checksum: string,
    segment: string,
    notes: string,
    status: DeflectionThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.ceiling = ceiling;
    this.visible = visible;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.checksum = checksum;
    this.segment = segment;
    this.notes = notes;
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

  canMoveTo(next: DeflectionThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DeflectionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round(this.ceiling * this.priority * 100) / 100;
  }

  copy(): DeflectionThreshold {
    return new DeflectionThreshold(
      this.code,
      this.label,
      this.priority,
      this.ceiling,
      this.visible,
      this.externalRef,
      this.journeyId,
      this.checksum,
      this.segment,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a deflection threshold in status proposed. */
export function newDeflectionThreshold(code: string, label: string): DeflectionThreshold {
  return new DeflectionThreshold(code, label, 0, 0, false, "", "", "", "", "", "proposed");
}
