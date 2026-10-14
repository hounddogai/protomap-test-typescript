/**
 * The batched funnel assignment records of growth's funnel work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched funnel assignment is in its life cycle. */
export type BatchedFunnelAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A batched funnel assignment. Its code is unique within a tenant. */
export class BatchedFunnelAssignment {
  code: string;
  title: string;
  ratio: number;
  notes: string;
  ownerId: string;
  region: string;
  cost: number;
  unit: string;
  archived: boolean;
  attributes: Map<string, string>;
  name: string;
  status: BatchedFunnelAssignmentStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    notes: string,
    ownerId: string,
    region: string,
    cost: number,
    unit: string,
    archived: boolean,
    attributes: Map<string, string>,
    name: string,
    status: BatchedFunnelAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.notes = notes;
    this.ownerId = ownerId;
    this.region = region;
    this.cost = cost;
    this.unit = unit;
    this.archived = archived;
    this.attributes = attributes;
    this.name = name;
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

  canMoveTo(next: BatchedFunnelAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedFunnelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched funnel assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched funnel assignment"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.ratio - this.cost) * 100) / 100;
  }

  copy(): BatchedFunnelAssignment {
    return new BatchedFunnelAssignment(
      this.code,
      this.title,
      this.ratio,
      this.notes,
      this.ownerId,
      this.region,
      this.cost,
      this.unit,
      this.archived,
      this.attributes,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched funnel assignment in status created. */
export function newBatchedFunnelAssignment(code: string, title: string): BatchedFunnelAssignment {
  return new BatchedFunnelAssignment(
    code,
    title,
    0,
    "",
    "",
    "",
    0,
    "",
    false,
    new Map<string, string>(),
    "",
    "created",
  );
}
