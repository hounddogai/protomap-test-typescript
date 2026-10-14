/**
 * The preference item records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference item is in its life cycle. */
export type PreferenceItemStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a preference item and its current status. */
export class PreferenceItem {
  code: string;
  label: string;
  tags: string[];
  segment: string;
  variant: string;
  description: string;
  sequence: number;
  windowDays: number;
  status: PreferenceItemStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    segment: string,
    variant: string,
    description: string,
    sequence: number,
    windowDays: number,
    status: PreferenceItemStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.segment = segment;
    this.variant = variant;
    this.description = description;
    this.sequence = sequence;
    this.windowDays = windowDays;
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

  canMoveTo(next: PreferenceItemStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PreferenceItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.windowDays - this.sequence) * 100) / 100;
  }

  copy(): PreferenceItem {
    return new PreferenceItem(
      this.code,
      this.label,
      this.tags,
      this.segment,
      this.variant,
      this.description,
      this.sequence,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a preference item in status idle. */
export function newPreferenceItem(code: string, label: string): PreferenceItem {
  return new PreferenceItem(code, label, [], "", "", "", 0, 0, "idle");
}
