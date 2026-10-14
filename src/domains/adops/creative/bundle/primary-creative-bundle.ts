/**
 * The primary creative bundle records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary creative bundle is in its life cycle. */
export type PrimaryCreativeBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary creative bundle and its current status. */
export class PrimaryCreativeBundle {
  code: string;
  label: string;
  ceiling: number;
  weight: number;
  variant: string;
  attributes: Map<string, string>;
  maximum: number;
  batchSize: number;
  category: string;
  status: PrimaryCreativeBundleStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    weight: number,
    variant: string,
    attributes: Map<string, string>,
    maximum: number,
    batchSize: number,
    category: string,
    status: PrimaryCreativeBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.weight = weight;
    this.variant = variant;
    this.attributes = attributes;
    this.maximum = maximum;
    this.batchSize = batchSize;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryCreativeBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PrimaryCreativeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary creative bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.weight - this.ceiling) * 100) / 100;
  }

  copy(): PrimaryCreativeBundle {
    return new PrimaryCreativeBundle(
      this.code,
      this.label,
      this.ceiling,
      this.weight,
      this.variant,
      this.attributes,
      this.maximum,
      this.batchSize,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary creative bundle in status planned. */
export function newPrimaryCreativeBundle(code: string, label: string): PrimaryCreativeBundle {
  return new PrimaryCreativeBundle(code, label, 0, 0, "", new Map<string, string>(), 0, 0, "", "planned");
}
