import * as text from "../../../../kit/text.js";

/** Where a badge allocation is in its life cycle. */
export type BadgeAllocationStatus = "created" | "validated" | "published" | "retired";

/** A badge allocation. Its code is unique within a tenant. */
export class BadgeAllocation {
  code: string;
  name: string;
  priority: number;
  unit: string;
  campaignRef: string;
  source: string;
  status: BadgeAllocationStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    unit: string,
    campaignRef: string,
    source: string,
    status: BadgeAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.unit = unit;
    this.campaignRef = campaignRef;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): BadgeAllocation {
    return new BadgeAllocation(
      this.code,
      this.name,
      this.priority,
      this.unit,
      this.campaignRef,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a badge allocation in status created. */
export function newBadgeAllocation(code: string, name: string): BadgeAllocation {
  return new BadgeAllocation(code, name, 0, "", "", "", "created");
}
