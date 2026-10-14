/**
 * The tiered frequency snapshot records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered frequency snapshot is in its life cycle. */
export type TieredFrequencySnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered frequency snapshot as the frequency team keeps it. */
export class TieredFrequencySnapshot {
  code: string;
  label: string;
  createdAt: number;
  attributes: Map<string, string>;
  budget: number;
  category: string;
  endsAt: number;
  quantity: number;
  locale: string;
  status: TieredFrequencySnapshotStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    attributes: Map<string, string>,
    budget: number,
    category: string,
    endsAt: number,
    quantity: number,
    locale: string,
    status: TieredFrequencySnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.attributes = attributes;
    this.budget = budget;
    this.category = category;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.locale = locale;
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

  canMoveTo(next: TieredFrequencySnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredFrequencySnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered frequency snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
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

  weightedLoad(): number {
    return Math.round((this.endsAt + this.budget) * 100) / 100;
  }

  copy(): TieredFrequencySnapshot {
    return new TieredFrequencySnapshot(
      this.code,
      this.label,
      this.createdAt,
      this.attributes,
      this.budget,
      this.category,
      this.endsAt,
      this.quantity,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered frequency snapshot in status draft. */
export function newTieredFrequencySnapshot(code: string, label: string): TieredFrequencySnapshot {
  return new TieredFrequencySnapshot(code, label, 0, new Map<string, string>(), 0, "", 0, 0, "", "draft");
}
