/**
 * The touchpoint assignment records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint assignment is in its life cycle. */
export type TouchpointAssignmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a touchpoint assignment and its current status. */
export class TouchpointAssignment {
  code: string;
  label: string;
  pinned: boolean;
  title: string;
  campaignRef: string;
  cohort: string;
  utmSource: string;
  batchSize: number;
  archived: boolean;
  status: TouchpointAssignmentStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    title: string,
    campaignRef: string,
    cohort: string,
    utmSource: string,
    batchSize: number,
    archived: boolean,
    status: TouchpointAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.title = title;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.batchSize = batchSize;
    this.archived = archived;
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

  canMoveTo(next: TouchpointAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): TouchpointAssignment {
    return new TouchpointAssignment(
      this.code,
      this.label,
      this.pinned,
      this.title,
      this.campaignRef,
      this.cohort,
      this.utmSource,
      this.batchSize,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a touchpoint assignment in status created. */
export function newTouchpointAssignment(code: string, label: string): TouchpointAssignment {
  return new TouchpointAssignment(code, label, false, "", "", "", "", 0, false, "created");
}
