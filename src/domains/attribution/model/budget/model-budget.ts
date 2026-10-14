/**
 * The model budget records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model budget is in its life cycle. */
export type ModelBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** One model budget, with what the planners need to act on it. */
export class ModelBudget {
  code: string;
  title: string;
  ownerId: string;
  summary: string;
  tags: string[];
  createdAt: number;
  variant: string;
  capacity: number;
  ceiling: number;
  status: ModelBudgetStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    summary: string,
    tags: string[],
    createdAt: number,
    variant: string,
    capacity: number,
    ceiling: number,
    status: ModelBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.summary = summary;
    this.tags = tags;
    this.createdAt = createdAt;
    this.variant = variant;
    this.capacity = capacity;
    this.ceiling = ceiling;
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

  canMoveTo(next: ModelBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ModelBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round(this.capacity * this.ceiling * 100) / 100;
  }

  copy(): ModelBudget {
    return new ModelBudget(
      this.code,
      this.title,
      this.ownerId,
      this.summary,
      this.tags,
      this.createdAt,
      this.variant,
      this.capacity,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a model budget in status new. */
export function newModelBudget(code: string, title: string): ModelBudget {
  return new ModelBudget(code, title, "", "", [], 0, "", 0, 0, "new");
}
