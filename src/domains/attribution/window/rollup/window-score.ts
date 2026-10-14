import * as text from "../../../../kit/text.js";

/** Where a window score is in its life cycle. */
export type WindowScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A window score as the window team keeps it. */
export class WindowScore {
  code: string;
  label: string;
  channel: string;
  budget: number;
  approved: boolean;
  discount: number;
  status: WindowScoreStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    budget: number,
    approved: boolean,
    discount: number,
    status: WindowScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.budget = budget;
    this.approved = approved;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WindowScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.discount * this.budget * 100) / 100;
  }

  copy(): WindowScore {
    return new WindowScore(this.code, this.label, this.channel, this.budget, this.approved, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a window score in status planned. */
export function newWindowScore(code: string, label: string): WindowScore {
  return new WindowScore(code, label, "", 0, false, 0, "planned");
}
