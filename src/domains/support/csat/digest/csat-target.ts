import * as text from "../../../../kit/text.js";

/** Where a csat target is in its life cycle. */
export type CsatTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One csat target, with what the planners need to act on it. */
export class CsatTarget {
  code: string;
  name: string;
  description: string;
  active: boolean;
  timezone: string;
  maximum: number;
  floorValue: number;
  status: CsatTargetStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    active: boolean,
    timezone: string,
    maximum: number,
    floorValue: number,
    status: CsatTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.active = active;
    this.timezone = timezone;
    this.maximum = maximum;
    this.floorValue = floorValue;
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

  canMoveTo(next: CsatTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CsatTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.maximum - this.floorValue) * 100) / 100;
  }

  copy(): CsatTarget {
    return new CsatTarget(
      this.code,
      this.name,
      this.description,
      this.active,
      this.timezone,
      this.maximum,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a csat target in status draft. */
export function newCsatTarget(code: string, name: string): CsatTarget {
  return new CsatTarget(code, name, "", false, "", 0, 0, "draft");
}
