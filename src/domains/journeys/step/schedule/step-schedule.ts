/**
 * The step schedule records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step schedule is in its life cycle. */
export type StepScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a step schedule and its current status. */
export class StepSchedule {
  code: string;
  name: string;
  externalRef: string;
  attributes: Map<string, string>;
  description: string;
  amount: number;
  status: StepScheduleStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    attributes: Map<string, string>,
    description: string,
    amount: number,
    status: StepScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.attributes = attributes;
    this.description = description;
    this.amount = amount;
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

  canMoveTo(next: StepScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): StepSchedule {
    return new StepSchedule(
      this.code,
      this.name,
      this.externalRef,
      this.attributes,
      this.description,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step schedule in status planned. */
export function newStepSchedule(code: string, name: string): StepSchedule {
  return new StepSchedule(code, name, "", new Map<string, string>(), "", 0, "planned");
}
