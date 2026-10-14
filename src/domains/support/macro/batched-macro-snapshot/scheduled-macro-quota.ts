import * as text from "../../../../kit/text.js";

/** Where a scheduled macro quota is in its life cycle. */
export type ScheduledMacroQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a scheduled macro quota and its current status. */
export class ScheduledMacroQuota {
  code: string;
  title: string;
  active: boolean;
  name: string;
  description: string;
  amount: number;
  status: ScheduledMacroQuotaStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    name: string,
    description: string,
    amount: number,
    status: ScheduledMacroQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.name = name;
    this.description = description;
    this.amount = amount;
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

  canMoveTo(next: ScheduledMacroQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledMacroQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled macro quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ScheduledMacroQuota {
    return new ScheduledMacroQuota(
      this.code,
      this.title,
      this.active,
      this.name,
      this.description,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled macro quota in status draft. */
export function newScheduledMacroQuota(code: string, title: string): ScheduledMacroQuota {
  return new ScheduledMacroQuota(code, title, false, "", "", 0, "draft");
}
