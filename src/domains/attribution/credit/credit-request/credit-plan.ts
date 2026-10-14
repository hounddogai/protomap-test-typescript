import * as text from "../../../../kit/text.js";

/** Where a credit plan is in its life cycle. */
export type CreditPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A credit plan. Its code is unique within a tenant. */
export class CreditPlan {
  code: string;
  name: string;
  revision: number;
  archived: boolean;
  audienceId: string;
  quantity: number;
  attempts: number;
  expiresAt: number;
  durationMinutes: number;
  status: CreditPlanStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    archived: boolean,
    audienceId: string,
    quantity: number,
    attempts: number,
    expiresAt: number,
    durationMinutes: number,
    status: CreditPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.archived = archived;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.attempts = attempts;
    this.expiresAt = expiresAt;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CreditPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round((this.durationMinutes + this.attempts) * 100) / 100;
  }

  copy(): CreditPlan {
    return new CreditPlan(
      this.code,
      this.name,
      this.revision,
      this.archived,
      this.audienceId,
      this.quantity,
      this.attempts,
      this.expiresAt,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a credit plan in status open. */
export function newCreditPlan(code: string, name: string): CreditPlan {
  return new CreditPlan(code, name, 0, false, "", 0, 0, 0, 0, "open");
}
