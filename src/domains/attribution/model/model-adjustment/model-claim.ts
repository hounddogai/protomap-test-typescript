import * as text from "../../../../kit/text.js";

/** Where a model claim is in its life cycle. */
export type ModelClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A model claim. Its code is unique within a tenant. */
export class ModelClaim {
  code: string;
  name: string;
  unit: string;
  budget: number;
  graceDays: number;
  capacity: number;
  checksum: string;
  floorValue: number;
  updatedAt: number;
  limit: number;
  revision: number;
  status: ModelClaimStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    budget: number,
    graceDays: number,
    capacity: number,
    checksum: string,
    floorValue: number,
    updatedAt: number,
    limit: number,
    revision: number,
    status: ModelClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.budget = budget;
    this.graceDays = graceDays;
    this.capacity = capacity;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.updatedAt = updatedAt;
    this.limit = limit;
    this.revision = revision;
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

  canMoveTo(next: ModelClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: ModelClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"model claim"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.revision + this.budget) * 100) / 100;
  }

  copy(): ModelClaim {
    return new ModelClaim(
      this.code,
      this.name,
      this.unit,
      this.budget,
      this.graceDays,
      this.capacity,
      this.checksum,
      this.floorValue,
      this.updatedAt,
      this.limit,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a model claim in status draft. */
export function newModelClaim(code: string, name: string): ModelClaim {
  return new ModelClaim(code, name, "", 0, 0, 0, "", 0, 0, 0, 0, "draft");
}
