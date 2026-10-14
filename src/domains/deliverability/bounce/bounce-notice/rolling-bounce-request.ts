import * as text from "../../../../kit/text.js";

/** Where a rolling bounce request is in its life cycle. */
export type RollingBounceRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling bounce request, with what the planners need to act on it. */
export class RollingBounceRequest {
  code: string;
  label: string;
  budget: number;
  version: number;
  weight: number;
  graceDays: number;
  status: RollingBounceRequestStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    version: number,
    weight: number,
    graceDays: number,
    status: RollingBounceRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.version = version;
    this.weight = weight;
    this.graceDays = graceDays;
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

  canMoveTo(next: RollingBounceRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingBounceRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling bounce request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"rolling bounce request"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.weight - this.budget) * 100) / 100;
  }

  copy(): RollingBounceRequest {
    return new RollingBounceRequest(
      this.code,
      this.label,
      this.budget,
      this.version,
      this.weight,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling bounce request in status draft. */
export function newRollingBounceRequest(code: string, label: string): RollingBounceRequest {
  return new RollingBounceRequest(code, label, 0, 0, 0, 0, "draft");
}
