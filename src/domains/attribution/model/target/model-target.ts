/**
 * The model target records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model target is in its life cycle. */
export type ModelTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A model target as the model team keeps it. */
export class ModelTarget {
  code: string;
  title: string;
  utmSource: string;
  conversionRate: number;
  updatedAt: number;
  startsAt: number;
  minimum: number;
  quantity: number;
  tags: string[];
  batchSize: number;
  status: ModelTargetStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    conversionRate: number,
    updatedAt: number,
    startsAt: number,
    minimum: number,
    quantity: number,
    tags: string[],
    batchSize: number,
    status: ModelTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.conversionRate = conversionRate;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.quantity = quantity;
    this.tags = tags;
    this.batchSize = batchSize;
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

  canMoveTo(next: ModelTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ModelTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"model target"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.updatedAt + this.batchSize) * 100) / 100;
  }

  copy(): ModelTarget {
    return new ModelTarget(
      this.code,
      this.title,
      this.utmSource,
      this.conversionRate,
      this.updatedAt,
      this.startsAt,
      this.minimum,
      this.quantity,
      this.tags,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a model target in status planned. */
export function newModelTarget(code: string, title: string): ModelTarget {
  return new ModelTarget(code, title, "", 0, 0, 0, 0, 0, [], 0, "planned");
}
