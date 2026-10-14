/**
 * The path quota records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path quota is in its life cycle. */
export type PathQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** One path quota, with what the planners need to act on it. */
export class PathQuota {
  code: string;
  label: string;
  ownerId: string;
  description: string;
  archived: boolean;
  budget: number;
  ceiling: number;
  status: PathQuotaStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    description: string,
    archived: boolean,
    budget: number,
    ceiling: number,
    status: PathQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.description = description;
    this.archived = archived;
    this.budget = budget;
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

  canMoveTo(next: PathQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PathQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round(this.ceiling * this.budget * 100) / 100;
  }

  copy(): PathQuota {
    return new PathQuota(
      this.code,
      this.label,
      this.ownerId,
      this.description,
      this.archived,
      this.budget,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a path quota in status new. */
export function newPathQuota(code: string, label: string): PathQuota {
  return new PathQuota(code, label, "", "", false, 0, 0, "new");
}
