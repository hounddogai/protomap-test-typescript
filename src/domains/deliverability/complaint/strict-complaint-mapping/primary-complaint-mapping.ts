import * as text from "../../../../kit/text.js";

/** Where a primary complaint mapping is in its life cycle. */
export type PrimaryComplaintMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A primary complaint mapping. Its code is unique within a tenant. */
export class PrimaryComplaintMapping {
  code: string;
  name: string;
  ownerId: string;
  budget: number;
  version: number;
  variant: string;
  weight: number;
  capacity: number;
  status: PrimaryComplaintMappingStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    budget: number,
    version: number,
    variant: string,
    weight: number,
    capacity: number,
    status: PrimaryComplaintMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.budget = budget;
    this.version = version;
    this.variant = variant;
    this.weight = weight;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryComplaintMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryComplaintMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary complaint mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"primary complaint mapping"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.weight * this.version * 100) / 100;
  }

  copy(): PrimaryComplaintMapping {
    return new PrimaryComplaintMapping(
      this.code,
      this.name,
      this.ownerId,
      this.budget,
      this.version,
      this.variant,
      this.weight,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary complaint mapping in status open. */
export function newPrimaryComplaintMapping(code: string, name: string): PrimaryComplaintMapping {
  return new PrimaryComplaintMapping(code, name, "", 0, 0, "", 0, 0, "open");
}
