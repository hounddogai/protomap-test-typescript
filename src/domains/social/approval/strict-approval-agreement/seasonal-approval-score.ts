import * as text from "../../../../kit/text.js";

/** Where a seasonal approval score is in its life cycle. */
export type SeasonalApprovalScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal approval score. Its code is unique within a tenant. */
export class SeasonalApprovalScore {
  code: string;
  name: string;
  capacity: number;
  description: string;
  startsAt: number;
  status: SeasonalApprovalScoreStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    description: string,
    startsAt: number,
    status: SeasonalApprovalScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.description = description;
    this.startsAt = startsAt;
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

  canMoveTo(next: SeasonalApprovalScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalApprovalScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal approval score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round((this.startsAt + this.capacity) * 100) / 100;
  }

  copy(): SeasonalApprovalScore {
    return new SeasonalApprovalScore(this.code, this.name, this.capacity, this.description, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal approval score in status proposed. */
export function newSeasonalApprovalScore(code: string, name: string): SeasonalApprovalScore {
  return new SeasonalApprovalScore(code, name, 0, "", 0, "proposed");
}
