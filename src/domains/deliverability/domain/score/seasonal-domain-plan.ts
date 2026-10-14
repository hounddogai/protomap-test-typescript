import * as text from "../../../../kit/text.js";

/** Where a seasonal domain plan is in its life cycle. */
export type SeasonalDomainPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal domain plan. Its code is unique within a tenant. */
export class SeasonalDomainPlan {
  code: string;
  title: string;
  priority: number;
  unit: string;
  visible: boolean;
  contactEmail: string;
  category: string;
  status: SeasonalDomainPlanStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    unit: string,
    visible: boolean,
    contactEmail: string,
    category: string,
    status: SeasonalDomainPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.unit = unit;
    this.visible = visible;
    this.contactEmail = contactEmail;
    this.category = category;
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

  canMoveTo(next: SeasonalDomainPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalDomainPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal domain plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): SeasonalDomainPlan {
    return new SeasonalDomainPlan(
      this.code,
      this.title,
      this.priority,
      this.unit,
      this.visible,
      this.contactEmail,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a seasonal domain plan in status planned. */
export function newSeasonalDomainPlan(code: string, title: string): SeasonalDomainPlan {
  return new SeasonalDomainPlan(code, title, 0, "", false, "", "", "planned");
}
