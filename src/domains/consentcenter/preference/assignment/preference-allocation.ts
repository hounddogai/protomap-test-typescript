import * as text from "../../../../kit/text.js";

/** Where a preference allocation is in its life cycle. */
export type PreferenceAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a preference allocation and its current status. */
export class PreferenceAllocation {
  code: string;
  name: string;
  region: string;
  updatedAt: number;
  openRate: number;
  status: PreferenceAllocationStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    updatedAt: number,
    openRate: number,
    status: PreferenceAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
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

  canMoveTo(next: PreferenceAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
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

  moveTo(next: PreferenceAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"preference allocation"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.openRate - this.updatedAt) * 100) / 100;
  }

  copy(): PreferenceAllocation {
    return new PreferenceAllocation(this.code, this.name, this.region, this.updatedAt, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a preference allocation in status open. */
export function newPreferenceAllocation(code: string, name: string): PreferenceAllocation {
  return new PreferenceAllocation(code, name, "", 0, 0, "open");
}
