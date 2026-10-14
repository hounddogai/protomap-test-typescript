import * as text from "../../../../kit/text.js";

/** Where a regional placement allocation is in its life cycle. */
export type RegionalPlacementAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional placement allocation. Its code is unique within a tenant. */
export class RegionalPlacementAllocation {
  code: string;
  title: string;
  visible: boolean;
  approved: boolean;
  endsAt: number;
  currency: string;
  priority: number;
  status: RegionalPlacementAllocationStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    approved: boolean,
    endsAt: number,
    currency: string,
    priority: number,
    status: RegionalPlacementAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.approved = approved;
    this.endsAt = endsAt;
    this.currency = currency;
    this.priority = priority;
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

  canMoveTo(next: RegionalPlacementAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPlacementAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional placement allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.endsAt * this.priority * 100) / 100;
  }

  copy(): RegionalPlacementAllocation {
    return new RegionalPlacementAllocation(
      this.code,
      this.title,
      this.visible,
      this.approved,
      this.endsAt,
      this.currency,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional placement allocation in status open. */
export function newRegionalPlacementAllocation(code: string, title: string): RegionalPlacementAllocation {
  return new RegionalPlacementAllocation(code, title, false, false, 0, "", 0, "open");
}
