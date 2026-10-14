import * as text from "../../../../kit/text.js";

/** Where a branch template is in its life cycle. */
export type BranchTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A branch template. Its code is unique within a tenant. */
export class BranchTemplate {
  code: string;
  name: string;
  floorValue: number;
  revision: number;
  cohort: string;
  startsAt: number;
  batchSize: number;
  campaignRef: string;
  graceDays: number;
  status: BranchTemplateStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    revision: number,
    cohort: string,
    startsAt: number,
    batchSize: number,
    campaignRef: string,
    graceDays: number,
    status: BranchTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.revision = revision;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.graceDays = graceDays;
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

  canMoveTo(next: BranchTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BranchTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.revision + this.startsAt) * 100) / 100;
  }

  copy(): BranchTemplate {
    return new BranchTemplate(
      this.code,
      this.name,
      this.floorValue,
      this.revision,
      this.cohort,
      this.startsAt,
      this.batchSize,
      this.campaignRef,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a branch template in status planned. */
export function newBranchTemplate(code: string, name: string): BranchTemplate {
  return new BranchTemplate(code, name, 0, 0, "", 0, 0, "", 0, "planned");
}
