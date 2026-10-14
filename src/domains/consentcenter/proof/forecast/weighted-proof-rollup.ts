import * as text from "../../../../kit/text.js";

/** Where a weighted proof rollup is in its life cycle. */
export type WeightedProofRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a weighted proof rollup and its current status. */
export class WeightedProofRollup {
  code: string;
  name: string;
  ratio: number;
  capacity: number;
  startsAt: number;
  endsAt: number;
  expiresAt: number;
  unit: string;
  status: WeightedProofRollupStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    capacity: number,
    startsAt: number,
    endsAt: number,
    expiresAt: number,
    unit: string,
    status: WeightedProofRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.capacity = capacity;
    this.startsAt = startsAt;
    this.endsAt = endsAt;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: WeightedProofRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedProofRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted proof rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round((this.endsAt - this.capacity) * 100) / 100;
  }

  copy(): WeightedProofRollup {
    return new WeightedProofRollup(
      this.code,
      this.name,
      this.ratio,
      this.capacity,
      this.startsAt,
      this.endsAt,
      this.expiresAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted proof rollup in status proposed. */
export function newWeightedProofRollup(code: string, name: string): WeightedProofRollup {
  return new WeightedProofRollup(code, name, 0, 0, 0, 0, 0, "", "proposed");
}
