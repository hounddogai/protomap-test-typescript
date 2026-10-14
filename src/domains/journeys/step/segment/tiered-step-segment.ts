/**
 * The tiered step segment records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered step segment is in its life cycle. */
export type TieredStepSegmentStatus = "created" | "validated" | "published" | "retired";

/** A tiered step segment as the step team keeps it. */
export class TieredStepSegment {
  code: string;
  label: string;
  frequencyCap: number;
  country: string;
  quantity: number;
  amount: number;
  tags: string[];
  name: string;
  cost: number;
  status: TieredStepSegmentStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    country: string,
    quantity: number,
    amount: number,
    tags: string[],
    name: string,
    cost: number,
    status: TieredStepSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.country = country;
    this.quantity = quantity;
    this.amount = amount;
    this.tags = tags;
    this.name = name;
    this.cost = cost;
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

  canMoveTo(next: TieredStepSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredStepSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered step segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.quantity + this.frequencyCap) * 100) / 100;
  }

  copy(): TieredStepSegment {
    return new TieredStepSegment(
      this.code,
      this.label,
      this.frequencyCap,
      this.country,
      this.quantity,
      this.amount,
      this.tags,
      this.name,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered step segment in status created. */
export function newTieredStepSegment(code: string, label: string): TieredStepSegment {
  return new TieredStepSegment(code, label, 0, "", 0, 0, [], "", 0, "created");
}
