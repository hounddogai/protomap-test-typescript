/**
 * The strict bounce cycle records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict bounce cycle is in its life cycle. */
export type StrictBounceCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a strict bounce cycle and its current status. */
export class StrictBounceCycle {
  code: string;
  name: string;
  externalRef: string;
  quantity: number;
  utmSource: string;
  budget: number;
  description: string;
  label: string;
  weight: number;
  endsAt: number;
  version: number;
  status: StrictBounceCycleStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    quantity: number,
    utmSource: string,
    budget: number,
    description: string,
    label: string,
    weight: number,
    endsAt: number,
    version: number,
    status: StrictBounceCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.quantity = quantity;
    this.utmSource = utmSource;
    this.budget = budget;
    this.description = description;
    this.label = label;
    this.weight = weight;
    this.endsAt = endsAt;
    this.version = version;
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

  canMoveTo(next: StrictBounceCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictBounceCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bounce cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget - this.quantity) * 100) / 100;
  }

  copy(): StrictBounceCycle {
    return new StrictBounceCycle(
      this.code,
      this.name,
      this.externalRef,
      this.quantity,
      this.utmSource,
      this.budget,
      this.description,
      this.label,
      this.weight,
      this.endsAt,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a strict bounce cycle in status planned. */
export function newStrictBounceCycle(code: string, name: string): StrictBounceCycle {
  return new StrictBounceCycle(code, name, "", 0, "", 0, "", "", 0, 0, 0, "planned");
}
