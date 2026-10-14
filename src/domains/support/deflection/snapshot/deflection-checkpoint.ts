import * as text from "../../../../kit/text.js";

/** Where a deflection checkpoint is in its life cycle. */
export type DeflectionCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A deflection checkpoint as the deflection team keeps it. */
export class DeflectionCheckpoint {
  code: string;
  name: string;
  ownerId: string;
  rate: number;
  weight: number;
  ratio: number;
  conversionRate: number;
  status: DeflectionCheckpointStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    rate: number,
    weight: number,
    ratio: number,
    conversionRate: number,
    status: DeflectionCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.rate = rate;
    this.weight = weight;
    this.ratio = ratio;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: DeflectionCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection checkpoint"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.weight * this.conversionRate * 100) / 100;
  }

  copy(): DeflectionCheckpoint {
    return new DeflectionCheckpoint(
      this.code,
      this.name,
      this.ownerId,
      this.rate,
      this.weight,
      this.ratio,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a deflection checkpoint in status draft. */
export function newDeflectionCheckpoint(code: string, name: string): DeflectionCheckpoint {
  return new DeflectionCheckpoint(code, name, "", 0, 0, 0, 0, "draft");
}
