import * as text from "../../../../kit/text.js";

/** Where a macro allocation is in its life cycle. */
export type MacroAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A macro allocation as the macro team keeps it. */
export class MacroAllocation {
  code: string;
  name: string;
  floorValue: number;
  weight: number;
  batchSize: number;
  windowDays: number;
  createdAt: number;
  journeyId: string;
  sequence: number;
  status: MacroAllocationStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    weight: number,
    batchSize: number,
    windowDays: number,
    createdAt: number,
    journeyId: string,
    sequence: number,
    status: MacroAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.weight = weight;
    this.batchSize = batchSize;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.sequence = sequence;
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

  canMoveTo(next: MacroAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.createdAt - this.windowDays) * 100) / 100;
  }

  copy(): MacroAllocation {
    return new MacroAllocation(
      this.code,
      this.name,
      this.floorValue,
      this.weight,
      this.batchSize,
      this.windowDays,
      this.createdAt,
      this.journeyId,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a macro allocation in status proposed. */
export function newMacroAllocation(code: string, name: string): MacroAllocation {
  return new MacroAllocation(code, name, 0, 0, 0, 0, 0, "", 0, "proposed");
}
