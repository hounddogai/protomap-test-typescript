/**
 * The touchpoint window records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint window is in its life cycle. */
export type TouchpointWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A touchpoint window. Its code is unique within a tenant. */
export class TouchpointWindow {
  code: string;
  name: string;
  ownerId: string;
  attempts: number;
  label: string;
  weight: number;
  cost: number;
  score: number;
  status: TouchpointWindowStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    attempts: number,
    label: string,
    weight: number,
    cost: number,
    score: number,
    status: TouchpointWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.label = label;
    this.weight = weight;
    this.cost = cost;
    this.score = score;
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

  canMoveTo(next: TouchpointWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TouchpointWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  projectedTotal(): number {
    return Math.round(this.weight * this.score * 100) / 100;
  }

  copy(): TouchpointWindow {
    return new TouchpointWindow(
      this.code,
      this.name,
      this.ownerId,
      this.attempts,
      this.label,
      this.weight,
      this.cost,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a touchpoint window in status proposed. */
export function newTouchpointWindow(code: string, name: string): TouchpointWindow {
  return new TouchpointWindow(code, name, "", 0, "", 0, 0, 0, "proposed");
}
