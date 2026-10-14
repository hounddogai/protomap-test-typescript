import * as text from "../../../../kit/text.js";

/** Where a exit rule batch is in its life cycle. */
export type ExitRuleBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a exit rule batch and its current status. */
export class ExitRuleBatch {
  code: string;
  name: string;
  archived: boolean;
  margin: number;
  ownerId: string;
  ceiling: number;
  title: string;
  segment: string;
  clicks: number;
  currency: string;
  limit: number;
  status: ExitRuleBatchStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    margin: number,
    ownerId: string,
    ceiling: number,
    title: string,
    segment: string,
    clicks: number,
    currency: string,
    limit: number,
    status: ExitRuleBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.margin = margin;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.title = title;
    this.segment = segment;
    this.clicks = clicks;
    this.currency = currency;
    this.limit = limit;
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

  canMoveTo(next: ExitRuleBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ExitRuleBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.limit + this.ceiling) * 100) / 100;
  }

  copy(): ExitRuleBatch {
    return new ExitRuleBatch(
      this.code,
      this.name,
      this.archived,
      this.margin,
      this.ownerId,
      this.ceiling,
      this.title,
      this.segment,
      this.clicks,
      this.currency,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a exit rule batch in status new. */
export function newExitRuleBatch(code: string, name: string): ExitRuleBatch {
  return new ExitRuleBatch(code, name, false, 0, "", 0, "", "", 0, "", 0, "new");
}
