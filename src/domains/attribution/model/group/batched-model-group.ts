/**
 * The batched model group records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched model group is in its life cycle. */
export type BatchedModelGroupStatus = "created" | "validated" | "published" | "retired";

/** One batched model group, with what the planners need to act on it. */
export class BatchedModelGroup {
  code: string;
  label: string;
  quantity: number;
  score: number;
  ceiling: number;
  maximum: number;
  name: string;
  frequencyCap: number;
  budget: number;
  attributes: Map<string, string>;
  status: BatchedModelGroupStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    score: number,
    ceiling: number,
    maximum: number,
    name: string,
    frequencyCap: number,
    budget: number,
    attributes: Map<string, string>,
    status: BatchedModelGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.score = score;
    this.ceiling = ceiling;
    this.maximum = maximum;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.attributes = attributes;
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

  canMoveTo(next: BatchedModelGroupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
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

  moveTo(next: BatchedModelGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched model group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round(this.quantity * this.ceiling * 100) / 100;
  }

  copy(): BatchedModelGroup {
    return new BatchedModelGroup(
      this.code,
      this.label,
      this.quantity,
      this.score,
      this.ceiling,
      this.maximum,
      this.name,
      this.frequencyCap,
      this.budget,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched model group in status created. */
export function newBatchedModelGroup(code: string, label: string): BatchedModelGroup {
  return new BatchedModelGroup(code, label, 0, 0, 0, 0, "", 0, 0, new Map<string, string>(), "created");
}
