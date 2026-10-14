import * as text from "../../../../kit/text.js";

/** Where a placement notice is in its life cycle. */
export type PlacementNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A placement notice. Its code is unique within a tenant. */
export class PlacementNotice {
  code: string;
  name: string;
  clicks: number;
  budget: number;
  visible: boolean;
  status: PlacementNoticeStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    budget: number,
    visible: boolean,
    status: PlacementNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.budget = budget;
    this.visible = visible;
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

  canMoveTo(next: PlacementNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PlacementNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round(this.budget * this.clicks * 100) / 100;
  }

  copy(): PlacementNotice {
    return new PlacementNotice(this.code, this.name, this.clicks, this.budget, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a placement notice in status proposed. */
export function newPlacementNotice(code: string, name: string): PlacementNotice {
  return new PlacementNotice(code, name, 0, 0, false, "proposed");
}
