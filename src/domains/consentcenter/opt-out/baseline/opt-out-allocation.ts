import * as text from "../../../../kit/text.js";

/** Where a opt out allocation is in its life cycle. */
export type OptOutAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A opt out allocation as the opt out team keeps it. */
export class OptOutAllocation {
  code: string;
  label: string;
  title: string;
  tags: string[];
  frequencyCap: number;
  status: OptOutAllocationStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    tags: string[],
    frequencyCap: number,
    status: OptOutAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: OptOutAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"opt out allocation"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): OptOutAllocation {
    return new OptOutAllocation(this.code, this.label, this.title, this.tags, this.frequencyCap, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a opt out allocation in status draft. */
export function newOptOutAllocation(code: string, label: string): OptOutAllocation {
  return new OptOutAllocation(code, label, "", [], 0, "draft");
}
