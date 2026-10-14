import * as text from "../../../../kit/text.js";

/** Where a lenient complaint override is in its life cycle. */
export type LenientComplaintOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a lenient complaint override and its current status. */
export class LenientComplaintOverride {
  code: string;
  name: string;
  approved: boolean;
  quantity: number;
  clicks: number;
  status: LenientComplaintOverrideStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    quantity: number,
    clicks: number,
    status: LenientComplaintOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.quantity = quantity;
    this.clicks = clicks;
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

  canMoveTo(next: LenientComplaintOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientComplaintOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient complaint override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.clicks * this.quantity * 100) / 100;
  }

  copy(): LenientComplaintOverride {
    return new LenientComplaintOverride(this.code, this.name, this.approved, this.quantity, this.clicks, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient complaint override in status draft. */
export function newLenientComplaintOverride(code: string, name: string): LenientComplaintOverride {
  return new LenientComplaintOverride(code, name, false, 0, 0, "draft");
}
