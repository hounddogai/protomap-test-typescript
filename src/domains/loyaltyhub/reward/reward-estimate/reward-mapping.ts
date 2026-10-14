import * as text from "../../../../kit/text.js";

/** Where a reward mapping is in its life cycle. */
export type RewardMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reward mapping. Its code is unique within a tenant. */
export class RewardMapping {
  code: string;
  name: string;
  budget: number;
  active: boolean;
  unit: string;
  windowDays: number;
  minimum: number;
  status: RewardMappingStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    active: boolean,
    unit: string,
    windowDays: number,
    minimum: number,
    status: RewardMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.active = active;
    this.unit = unit;
    this.windowDays = windowDays;
    this.minimum = minimum;
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

  canMoveTo(next: RewardMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: RewardMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.windowDays + this.budget) * 100) / 100;
  }

  copy(): RewardMapping {
    return new RewardMapping(
      this.code,
      this.name,
      this.budget,
      this.active,
      this.unit,
      this.windowDays,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a reward mapping in status open. */
export function newRewardMapping(code: string, name: string): RewardMapping {
  return new RewardMapping(code, name, 0, false, "", 0, 0, "open");
}
