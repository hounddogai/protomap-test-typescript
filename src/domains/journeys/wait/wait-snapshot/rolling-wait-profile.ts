import * as text from "../../../../kit/text.js";

/** Where a rolling wait profile is in its life cycle. */
export type RollingWaitProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling wait profile. Its code is unique within a tenant. */
export class RollingWaitProfile {
  code: string;
  name: string;
  margin: number;
  ownerId: string;
  conversionRate: number;
  status: RollingWaitProfileStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    ownerId: string,
    conversionRate: number,
    status: RollingWaitProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.ownerId = ownerId;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RollingWaitProfileStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWaitProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling wait profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.margin - this.conversionRate) * 100) / 100;
  }

  copy(): RollingWaitProfile {
    return new RollingWaitProfile(this.code, this.name, this.margin, this.ownerId, this.conversionRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling wait profile in status open. */
export function newRollingWaitProfile(code: string, name: string): RollingWaitProfile {
  return new RollingWaitProfile(code, name, 0, "", 0, "open");
}
