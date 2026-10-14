import * as text from "../../../../kit/text.js";

/** Where a manual post budget is in its life cycle. */
export type ManualPostBudgetStatus = "created" | "validated" | "published" | "retired";

/** One manual post budget, with what the planners need to act on it. */
export class ManualPostBudget {
  code: string;
  name: string;
  createdAt: number;
  variant: string;
  locale: string;
  active: boolean;
  unit: string;
  expiresAt: number;
  quantity: number;
  label: string;
  campaignRef: string;
  status: ManualPostBudgetStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    variant: string,
    locale: string,
    active: boolean,
    unit: string,
    expiresAt: number,
    quantity: number,
    label: string,
    campaignRef: string,
    status: ManualPostBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.variant = variant;
    this.locale = locale;
    this.active = active;
    this.unit = unit;
    this.expiresAt = expiresAt;
    this.quantity = quantity;
    this.label = label;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualPostBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualPostBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual post budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round(this.createdAt * this.quantity * 100) / 100;
  }

  copy(): ManualPostBudget {
    return new ManualPostBudget(
      this.code,
      this.name,
      this.createdAt,
      this.variant,
      this.locale,
      this.active,
      this.unit,
      this.expiresAt,
      this.quantity,
      this.label,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual post budget in status created. */
export function newManualPostBudget(code: string, name: string): ManualPostBudget {
  return new ManualPostBudget(code, name, 0, "", "", false, "", 0, 0, "", "", "created");
}
