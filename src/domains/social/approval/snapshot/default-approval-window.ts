import * as text from "../../../../kit/text.js";

/** Where a default approval window is in its life cycle. */
export type DefaultApprovalWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One default approval window, with what the planners need to act on it. */
export class DefaultApprovalWindow {
  code: string;
  name: string;
  locale: string;
  campaignRef: string;
  endsAt: number;
  budget: number;
  weight: number;
  minimum: number;
  status: DefaultApprovalWindowStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    campaignRef: string,
    endsAt: number,
    budget: number,
    weight: number,
    minimum: number,
    status: DefaultApprovalWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.budget = budget;
    this.weight = weight;
    this.minimum = minimum;
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

  canMoveTo(next: DefaultApprovalWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: DefaultApprovalWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default approval window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.minimum * this.budget * 100) / 100;
  }

  copy(): DefaultApprovalWindow {
    return new DefaultApprovalWindow(
      this.code,
      this.name,
      this.locale,
      this.campaignRef,
      this.endsAt,
      this.budget,
      this.weight,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default approval window in status planned. */
export function newDefaultApprovalWindow(code: string, name: string): DefaultApprovalWindow {
  return new DefaultApprovalWindow(code, name, "", "", 0, 0, 0, 0, "planned");
}
