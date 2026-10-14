import * as text from "../../../../kit/text.js";

/** Where a regional activation budget is in its life cycle. */
export type RegionalActivationBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional activation budget. Its code is unique within a tenant. */
export class RegionalActivationBudget {
  code: string;
  name: string;
  source: string;
  visible: boolean;
  archived: boolean;
  expiresAt: number;
  sendAt: number;
  priority: number;
  approved: boolean;
  weight: number;
  status: RegionalActivationBudgetStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    visible: boolean,
    archived: boolean,
    expiresAt: number,
    sendAt: number,
    priority: number,
    approved: boolean,
    weight: number,
    status: RegionalActivationBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.visible = visible;
    this.archived = archived;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.priority = priority;
    this.approved = approved;
    this.weight = weight;
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

  canMoveTo(next: RegionalActivationBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalActivationBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional activation budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round((this.priority - this.expiresAt) * 100) / 100;
  }

  copy(): RegionalActivationBudget {
    return new RegionalActivationBudget(
      this.code,
      this.name,
      this.source,
      this.visible,
      this.archived,
      this.expiresAt,
      this.sendAt,
      this.priority,
      this.approved,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional activation budget in status proposed. */
export function newRegionalActivationBudget(code: string, name: string): RegionalActivationBudget {
  return new RegionalActivationBudget(code, name, "", false, false, 0, 0, 0, false, 0, "proposed");
}
