/**
 * The fallback frequency threshold records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback frequency threshold is in its life cycle. */
export type FallbackFrequencyThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback frequency threshold as the frequency team keeps it. */
export class FallbackFrequencyThreshold {
  code: string;
  title: string;
  attempts: number;
  name: string;
  clicks: number;
  description: string;
  label: string;
  status: FallbackFrequencyThresholdStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    name: string,
    clicks: number,
    description: string,
    label: string,
    status: FallbackFrequencyThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.name = name;
    this.clicks = clicks;
    this.description = description;
    this.label = label;
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

  canMoveTo(next: FallbackFrequencyThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackFrequencyThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback frequency threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.attempts * this.clicks * 100) / 100;
  }

  copy(): FallbackFrequencyThreshold {
    return new FallbackFrequencyThreshold(
      this.code,
      this.title,
      this.attempts,
      this.name,
      this.clicks,
      this.description,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback frequency threshold in status proposed. */
export function newFallbackFrequencyThreshold(code: string, title: string): FallbackFrequencyThreshold {
  return new FallbackFrequencyThreshold(code, title, 0, "", 0, "", "", "proposed");
}
