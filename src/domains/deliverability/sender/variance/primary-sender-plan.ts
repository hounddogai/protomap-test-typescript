import * as text from "../../../../kit/text.js";

/** Where a primary sender plan is in its life cycle. */
export type PrimarySenderPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** One primary sender plan, with what the planners need to act on it. */
export class PrimarySenderPlan {
  code: string;
  label: string;
  attributes: Map<string, string>;
  pinned: boolean;
  weight: number;
  status: PrimarySenderPlanStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    pinned: boolean,
    weight: number,
    status: PrimarySenderPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.pinned = pinned;
    this.weight = weight;
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

  canMoveTo(next: PrimarySenderPlanStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimarySenderPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sender plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): PrimarySenderPlan {
    return new PrimarySenderPlan(this.code, this.label, this.attributes, this.pinned, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary sender plan in status new. */
export function newPrimarySenderPlan(code: string, label: string): PrimarySenderPlan {
  return new PrimarySenderPlan(code, label, new Map<string, string>(), false, 0, "new");
}
