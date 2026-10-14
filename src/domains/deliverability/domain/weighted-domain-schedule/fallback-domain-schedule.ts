import * as text from "../../../../kit/text.js";

/** Where a fallback domain schedule is in its life cycle. */
export type FallbackDomainScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback domain schedule. Its code is unique within a tenant. */
export class FallbackDomainSchedule {
  code: string;
  label: string;
  ownerId: string;
  limit: number;
  weight: number;
  status: FallbackDomainScheduleStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    limit: number,
    weight: number,
    status: FallbackDomainScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.limit = limit;
    this.weight = weight;
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

  canMoveTo(next: FallbackDomainScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackDomainScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback domain schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback domain schedule"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.weight * this.limit * 100) / 100;
  }

  copy(): FallbackDomainSchedule {
    return new FallbackDomainSchedule(this.code, this.label, this.ownerId, this.limit, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback domain schedule in status open. */
export function newFallbackDomainSchedule(code: string, label: string): FallbackDomainSchedule {
  return new FallbackDomainSchedule(code, label, "", 0, 0, "open");
}
