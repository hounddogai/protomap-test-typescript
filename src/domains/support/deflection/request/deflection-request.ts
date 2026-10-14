/**
 * The deflection request records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection request is in its life cycle. */
export type DeflectionRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A deflection request. Its code is unique within a tenant. */
export class DeflectionRequest {
  code: string;
  label: string;
  budget: number;
  tags: string[];
  createdAt: number;
  quantity: number;
  utmSource: string;
  score: number;
  cost: number;
  status: DeflectionRequestStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    tags: string[],
    createdAt: number,
    quantity: number,
    utmSource: string,
    score: number,
    cost: number,
    status: DeflectionRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.tags = tags;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.utmSource = utmSource;
    this.score = score;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DeflectionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.score + this.cost) * 100) / 100;
  }

  copy(): DeflectionRequest {
    return new DeflectionRequest(
      this.code,
      this.label,
      this.budget,
      this.tags,
      this.createdAt,
      this.quantity,
      this.utmSource,
      this.score,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a deflection request in status proposed. */
export function newDeflectionRequest(code: string, label: string): DeflectionRequest {
  return new DeflectionRequest(code, label, 0, [], 0, 0, "", 0, 0, "proposed");
}
