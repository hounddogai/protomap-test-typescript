import * as text from "../../../../kit/text.js";

/** Where a capped step request is in its life cycle. */
export type CappedStepRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped step request, with what the planners need to act on it. */
export class CappedStepRequest {
  code: string;
  label: string;
  cost: number;
  budget: number;
  tags: string[];
  name: string;
  priority: number;
  timezone: string;
  version: number;
  weight: number;
  variant: string;
  status: CappedStepRequestStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    budget: number,
    tags: string[],
    name: string,
    priority: number,
    timezone: string,
    version: number,
    weight: number,
    variant: string,
    status: CappedStepRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.budget = budget;
    this.tags = tags;
    this.name = name;
    this.priority = priority;
    this.timezone = timezone;
    this.version = version;
    this.weight = weight;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedStepRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedStepRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped step request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round((this.priority + this.weight) * 100) / 100;
  }

  copy(): CappedStepRequest {
    return new CappedStepRequest(
      this.code,
      this.label,
      this.cost,
      this.budget,
      this.tags,
      this.name,
      this.priority,
      this.timezone,
      this.version,
      this.weight,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped step request in status proposed. */
export function newCappedStepRequest(code: string, label: string): CappedStepRequest {
  return new CappedStepRequest(code, label, 0, 0, [], "", 0, "", 0, 0, "", "proposed");
}
