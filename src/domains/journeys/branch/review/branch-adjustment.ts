import * as text from "../../../../kit/text.js";

/** Where a branch adjustment is in its life cycle. */
export type BranchAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One branch adjustment, with what the planners need to act on it. */
export class BranchAdjustment {
  code: string;
  name: string;
  utmSource: string;
  margin: number;
  locale: string;
  status: BranchAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    margin: number,
    locale: string,
    status: BranchAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.margin = margin;
    this.locale = locale;
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

  canMoveTo(next: BranchAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): BranchAdjustment {
    return new BranchAdjustment(this.code, this.name, this.utmSource, this.margin, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a branch adjustment in status draft. */
export function newBranchAdjustment(code: string, name: string): BranchAdjustment {
  return new BranchAdjustment(code, name, "", 0, "", "draft");
}
