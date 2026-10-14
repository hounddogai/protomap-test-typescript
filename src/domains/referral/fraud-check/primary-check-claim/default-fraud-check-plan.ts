import * as text from "../../../../kit/text.js";

/** Where a default fraud check plan is in its life cycle. */
export type DefaultFraudCheckPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default fraud check plan as the fraud check team keeps it. */
export class DefaultFraudCheckPlan {
  code: string;
  name: string;
  title: string;
  clicks: number;
  quantity: number;
  limit: number;
  status: DefaultFraudCheckPlanStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    clicks: number,
    quantity: number,
    limit: number,
    status: DefaultFraudCheckPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.clicks = clicks;
    this.quantity = quantity;
    this.limit = limit;
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

  canMoveTo(next: DefaultFraudCheckPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultFraudCheckPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default fraud check plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.clicks + this.quantity) * 100) / 100;
  }

  copy(): DefaultFraudCheckPlan {
    return new DefaultFraudCheckPlan(
      this.code,
      this.name,
      this.title,
      this.clicks,
      this.quantity,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default fraud check plan in status planned. */
export function newDefaultFraudCheckPlan(code: string, name: string): DefaultFraudCheckPlan {
  return new DefaultFraudCheckPlan(code, name, "", 0, 0, 0, "planned");
}
