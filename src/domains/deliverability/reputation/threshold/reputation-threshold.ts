/**
 * The reputation threshold records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation threshold is in its life cycle. */
export type ReputationThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reputation threshold. Its code is unique within a tenant. */
export class ReputationThreshold {
  code: string;
  label: string;
  rate: number;
  attempts: number;
  weight: number;
  active: boolean;
  status: ReputationThresholdStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    attempts: number,
    weight: number,
    active: boolean,
    status: ReputationThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.attempts = attempts;
    this.weight = weight;
    this.active = active;
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

  canMoveTo(next: ReputationThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.attempts - this.weight) * 100) / 100;
  }

  copy(): ReputationThreshold {
    return new ReputationThreshold(
      this.code,
      this.label,
      this.rate,
      this.attempts,
      this.weight,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation threshold in status planned. */
export function newReputationThreshold(code: string, label: string): ReputationThreshold {
  return new ReputationThreshold(code, label, 0, 0, 0, false, "planned");
}
