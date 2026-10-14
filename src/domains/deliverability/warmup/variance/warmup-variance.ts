/**
 * The warmup variance records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup variance is in its life cycle. */
export type WarmupVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a warmup variance and its current status. */
export class WarmupVariance {
  code: string;
  name: string;
  archived: boolean;
  weight: number;
  category: string;
  status: WarmupVarianceStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    weight: number,
    category: string,
    status: WarmupVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.weight = weight;
    this.category = category;
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

  canMoveTo(next: WarmupVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active" || next === "closed";
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

  moveTo(next: WarmupVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): WarmupVariance {
    return new WarmupVariance(this.code, this.name, this.archived, this.weight, this.category, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a warmup variance in status draft. */
export function newWarmupVariance(code: string, name: string): WarmupVariance {
  return new WarmupVariance(code, name, false, 0, "", "draft");
}
