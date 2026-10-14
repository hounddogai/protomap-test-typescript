/**
 * The activation draft records of growth's activation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation draft is in its life cycle. */
export type ActivationDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a activation draft and its current status. */
export class ActivationDraft {
  code: string;
  name: string;
  contactEmail: string;
  floorValue: number;
  budget: number;
  status: ActivationDraftStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    floorValue: number,
    budget: number,
    status: ActivationDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.floorValue = floorValue;
    this.budget = budget;
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

  canMoveTo(next: ActivationDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.budget + this.floorValue) * 100) / 100;
  }

  copy(): ActivationDraft {
    return new ActivationDraft(this.code, this.name, this.contactEmail, this.floorValue, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation draft in status open. */
export function newActivationDraft(code: string, name: string): ActivationDraft {
  return new ActivationDraft(code, name, "", 0, 0, "open");
}
