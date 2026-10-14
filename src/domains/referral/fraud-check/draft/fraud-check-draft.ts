/**
 * The fraud check draft records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check draft is in its life cycle. */
export type FraudCheckDraftStatus = "created" | "validated" | "published" | "retired";

/** The record of a fraud check draft and its current status. */
export class FraudCheckDraft {
  code: string;
  name: string;
  windowDays: number;
  unit: string;
  clicks: number;
  description: string;
  journeyId: string;
  archived: boolean;
  capacity: number;
  status: FraudCheckDraftStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    unit: string,
    clicks: number,
    description: string,
    journeyId: string,
    archived: boolean,
    capacity: number,
    status: FraudCheckDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.unit = unit;
    this.clicks = clicks;
    this.description = description;
    this.journeyId = journeyId;
    this.archived = archived;
    this.capacity = capacity;
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

  canMoveTo(next: FraudCheckDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.windowDays + this.capacity) * 100) / 100;
  }

  copy(): FraudCheckDraft {
    return new FraudCheckDraft(
      this.code,
      this.name,
      this.windowDays,
      this.unit,
      this.clicks,
      this.description,
      this.journeyId,
      this.archived,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fraud check draft in status created. */
export function newFraudCheckDraft(code: string, name: string): FraudCheckDraft {
  return new FraudCheckDraft(code, name, 0, "", 0, "", "", false, 0, "created");
}
