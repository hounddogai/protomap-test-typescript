/**
 * The streak preference records of loyaltyhub's streak work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak preference is in its life cycle. */
export type StreakPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a streak preference and its current status. */
export class StreakPreference {
  code: string;
  title: string;
  contactEmail: string;
  locale: string;
  externalRef: string;
  sequence: number;
  weight: number;
  notes: string;
  status: StreakPreferenceStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    locale: string,
    externalRef: string,
    sequence: number,
    weight: number,
    notes: string,
    status: StreakPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.locale = locale;
    this.externalRef = externalRef;
    this.sequence = sequence;
    this.weight = weight;
    this.notes = notes;
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

  canMoveTo(next: StreakPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
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

  moveTo(next: StreakPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round(this.sequence * this.weight * 100) / 100;
  }

  copy(): StreakPreference {
    return new StreakPreference(
      this.code,
      this.title,
      this.contactEmail,
      this.locale,
      this.externalRef,
      this.sequence,
      this.weight,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a streak preference in status draft. */
export function newStreakPreference(code: string, title: string): StreakPreference {
  return new StreakPreference(code, title, "", "", "", 0, 0, "", "draft");
}
