import * as text from "../../../../kit/text.js";

/** Where a step cycle is in its life cycle. */
export type StepCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A step cycle. Its code is unique within a tenant. */
export class StepCycle {
  code: string;
  name: string;
  region: string;
  active: boolean;
  bid: number;
  audienceId: string;
  status: StepCycleStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    active: boolean,
    bid: number,
    audienceId: string,
    status: StepCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.active = active;
    this.bid = bid;
    this.audienceId = audienceId;
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

  canMoveTo(next: StepCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StepCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): StepCycle {
    return new StepCycle(this.code, this.name, this.region, this.active, this.bid, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a step cycle in status planned. */
export function newStepCycle(code: string, name: string): StepCycle {
  return new StepCycle(code, name, "", false, 0, "", "planned");
}
