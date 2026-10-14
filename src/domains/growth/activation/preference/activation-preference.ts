/**
 * The activation preference records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation preference is in its life cycle. */
export type ActivationPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A activation preference as the activation team keeps it. */
export class ActivationPreference {
  code: string;
  title: string;
  endsAt: number;
  externalRef: string;
  timezone: string;
  status: ActivationPreferenceStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    externalRef: string,
    timezone: string,
    status: ActivationPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.timezone = timezone;
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

  canMoveTo(next: ActivationPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: ActivationPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): ActivationPreference {
    return new ActivationPreference(this.code, this.title, this.endsAt, this.externalRef, this.timezone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a activation preference in status draft. */
export function newActivationPreference(code: string, title: string): ActivationPreference {
  return new ActivationPreference(code, title, 0, "", "", "draft");
}
