import * as text from "../../../../kit/text.js";

/** Where a rolling escalation mapping is in its life cycle. */
export type RollingEscalationMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling escalation mapping, with what the planners need to act on it. */
export class RollingEscalationMapping {
  code: string;
  label: string;
  openRate: number;
  active: boolean;
  budget: number;
  limit: number;
  approved: boolean;
  status: RollingEscalationMappingStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    active: boolean,
    budget: number,
    limit: number,
    approved: boolean,
    status: RollingEscalationMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.active = active;
    this.budget = budget;
    this.limit = limit;
    this.approved = approved;
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

  canMoveTo(next: RollingEscalationMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingEscalationMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling escalation mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round(this.openRate * this.limit * 100) / 100;
  }

  copy(): RollingEscalationMapping {
    return new RollingEscalationMapping(
      this.code,
      this.label,
      this.openRate,
      this.active,
      this.budget,
      this.limit,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling escalation mapping in status planned. */
export function newRollingEscalationMapping(code: string, label: string): RollingEscalationMapping {
  return new RollingEscalationMapping(code, label, 0, false, 0, 0, false, "planned");
}
