/**
 * The default enrollment draft records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default enrollment draft is in its life cycle. */
export type DefaultEnrollmentDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default enrollment draft. Its code is unique within a tenant. */
export class DefaultEnrollmentDraft {
  code: string;
  label: string;
  budget: number;
  active: boolean;
  durationMinutes: number;
  minimum: number;
  status: DefaultEnrollmentDraftStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    active: boolean,
    durationMinutes: number,
    minimum: number,
    status: DefaultEnrollmentDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.active = active;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultEnrollmentDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultEnrollmentDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default enrollment draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedExposure(): number {
    return Math.round(this.minimum * this.durationMinutes * 100) / 100;
  }

  copy(): DefaultEnrollmentDraft {
    return new DefaultEnrollmentDraft(
      this.code,
      this.label,
      this.budget,
      this.active,
      this.durationMinutes,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default enrollment draft in status idle. */
export function newDefaultEnrollmentDraft(code: string, label: string): DefaultEnrollmentDraft {
  return new DefaultEnrollmentDraft(code, label, 0, false, 0, 0, "idle");
}
