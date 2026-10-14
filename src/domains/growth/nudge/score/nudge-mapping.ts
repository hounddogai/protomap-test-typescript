import * as text from "../../../../kit/text.js";

/** Where a nudge mapping is in its life cycle. */
export type NudgeMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A nudge mapping. Its code is unique within a tenant. */
export class NudgeMapping {
  code: string;
  name: string;
  ratio: number;
  ownerId: string;
  floorValue: number;
  budget: number;
  unit: string;
  status: NudgeMappingStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    ownerId: string,
    floorValue: number,
    budget: number,
    unit: string,
    status: NudgeMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.budget = budget;
    this.unit = unit;
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

  canMoveTo(next: NudgeMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: NudgeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.ratio + this.floorValue) * 100) / 100;
  }

  copy(): NudgeMapping {
    return new NudgeMapping(
      this.code,
      this.name,
      this.ratio,
      this.ownerId,
      this.floorValue,
      this.budget,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a nudge mapping in status proposed. */
export function newNudgeMapping(code: string, name: string): NudgeMapping {
  return new NudgeMapping(code, name, 0, "", 0, 0, "", "proposed");
}
