import * as text from "../../../../kit/text.js";

/** Where a global deflection allocation is in its life cycle. */
export type GlobalDeflectionAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global deflection allocation and its current status. */
export class GlobalDeflectionAllocation {
  code: string;
  name: string;
  minimum: number;
  retries: number;
  country: string;
  status: GlobalDeflectionAllocationStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    retries: number,
    country: string,
    status: GlobalDeflectionAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.retries = retries;
    this.country = country;
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

  canMoveTo(next: GlobalDeflectionAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: GlobalDeflectionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global deflection allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global deflection allocation"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.minimum - this.retries) * 100) / 100;
  }

  copy(): GlobalDeflectionAllocation {
    return new GlobalDeflectionAllocation(this.code, this.name, this.minimum, this.retries, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global deflection allocation in status draft. */
export function newGlobalDeflectionAllocation(code: string, name: string): GlobalDeflectionAllocation {
  return new GlobalDeflectionAllocation(code, name, 0, 0, "", "draft");
}
