/**
 * The weighted step window records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted step window is in its life cycle. */
export type WeightedStepWindowStatus = "created" | "validated" | "published" | "retired";

/** One weighted step window, with what the planners need to act on it. */
export class WeightedStepWindow {
  code: string;
  label: string;
  updatedAt: number;
  locale: string;
  notes: string;
  sequence: number;
  ceiling: number;
  tags: string[];
  margin: number;
  floorValue: number;
  durationMinutes: number;
  status: WeightedStepWindowStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    locale: string,
    notes: string,
    sequence: number,
    ceiling: number,
    tags: string[],
    margin: number,
    floorValue: number,
    durationMinutes: number,
    status: WeightedStepWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.notes = notes;
    this.sequence = sequence;
    this.ceiling = ceiling;
    this.tags = tags;
    this.margin = margin;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: WeightedStepWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedStepWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted step window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.margin + this.ceiling) * 100) / 100;
  }

  copy(): WeightedStepWindow {
    return new WeightedStepWindow(
      this.code,
      this.label,
      this.updatedAt,
      this.locale,
      this.notes,
      this.sequence,
      this.ceiling,
      this.tags,
      this.margin,
      this.floorValue,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted step window in status created. */
export function newWeightedStepWindow(code: string, label: string): WeightedStepWindow {
  return new WeightedStepWindow(code, label, 0, "", "", 0, 0, [], 0, 0, 0, "created");
}
