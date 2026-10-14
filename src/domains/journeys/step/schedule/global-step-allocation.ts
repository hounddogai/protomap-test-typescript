import * as text from "../../../../kit/text.js";

/** Where a global step allocation is in its life cycle. */
export type GlobalStepAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global step allocation. Its code is unique within a tenant. */
export class GlobalStepAllocation {
  code: string;
  label: string;
  journeyId: string;
  revision: number;
  updatedAt: number;
  unit: string;
  summary: string;
  rate: number;
  status: GlobalStepAllocationStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    revision: number,
    updatedAt: number,
    unit: string,
    summary: string,
    rate: number,
    status: GlobalStepAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.unit = unit;
    this.summary = summary;
    this.rate = rate;
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

  canMoveTo(next: GlobalStepAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
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

  moveTo(next: GlobalStepAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global step allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.revision * this.updatedAt * 100) / 100;
  }

  copy(): GlobalStepAllocation {
    return new GlobalStepAllocation(
      this.code,
      this.label,
      this.journeyId,
      this.revision,
      this.updatedAt,
      this.unit,
      this.summary,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global step allocation in status draft. */
export function newGlobalStepAllocation(code: string, label: string): GlobalStepAllocation {
  return new GlobalStepAllocation(code, label, "", 0, 0, "", "", 0, "draft");
}
