import * as text from "../../../../kit/text.js";

/** Where a complaint exception is in its life cycle. */
export type ComplaintExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** A complaint exception as the complaint team keeps it. */
export class ComplaintException {
  code: string;
  name: string;
  priority: number;
  attributes: Map<string, string>;
  cost: number;
  status: ComplaintExceptionStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    attributes: Map<string, string>,
    cost: number,
    status: ComplaintExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.attributes = attributes;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ComplaintExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.priority - this.cost) * 100) / 100;
  }

  copy(): ComplaintException {
    return new ComplaintException(this.code, this.name, this.priority, this.attributes, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a complaint exception in status new. */
export function newComplaintException(code: string, name: string): ComplaintException {
  return new ComplaintException(code, name, 0, new Map<string, string>(), 0, "new");
}
