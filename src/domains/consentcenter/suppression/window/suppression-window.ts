/**
 * The suppression window records of consentcenter's suppression work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression window is in its life cycle. */
export type SuppressionWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A suppression window. Its code is unique within a tenant. */
export class SuppressionWindow {
  code: string;
  title: string;
  locale: string;
  segment: string;
  attributes: Map<string, string>;
  openRate: number;
  floorValue: number;
  variant: string;
  weight: number;
  status: SuppressionWindowStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    segment: string,
    attributes: Map<string, string>,
    openRate: number,
    floorValue: number,
    variant: string,
    weight: number,
    status: SuppressionWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.segment = segment;
    this.attributes = attributes;
    this.openRate = openRate;
    this.floorValue = floorValue;
    this.variant = variant;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionWindowStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.openRate + this.floorValue) * 100) / 100;
  }

  copy(): SuppressionWindow {
    return new SuppressionWindow(
      this.code,
      this.title,
      this.locale,
      this.segment,
      this.attributes,
      this.openRate,
      this.floorValue,
      this.variant,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a suppression window in status new. */
export function newSuppressionWindow(code: string, title: string): SuppressionWindow {
  return new SuppressionWindow(code, title, "", "", new Map<string, string>(), 0, 0, "", 0, "new");
}
