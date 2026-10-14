/**
 * The activation tier records of growth's activation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation tier is in its life cycle. */
export type ActivationTierStatus = "created" | "validated" | "published" | "retired";

/** One activation tier, with what the planners need to act on it. */
export class ActivationTier {
  code: string;
  label: string;
  retries: number;
  summary: string;
  capacity: number;
  locale: string;
  status: ActivationTierStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    summary: string,
    capacity: number,
    locale: string,
    status: ActivationTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.summary = summary;
    this.capacity = capacity;
    this.locale = locale;
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

  canMoveTo(next: ActivationTierStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
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

  moveTo(next: ActivationTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"activation tier"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.capacity + this.retries) * 100) / 100;
  }

  copy(): ActivationTier {
    return new ActivationTier(
      this.code,
      this.label,
      this.retries,
      this.summary,
      this.capacity,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a activation tier in status created. */
export function newActivationTier(code: string, label: string): ActivationTier {
  return new ActivationTier(code, label, 0, "", 0, "", "created");
}
