import * as text from "../../../../kit/text.js";

/** Where a tier proposal is in its life cycle. */
export type TierProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tier proposal as the tier team keeps it. */
export class TierProposal {
  code: string;
  name: string;
  active: boolean;
  limit: number;
  locale: string;
  priority: number;
  status: TierProposalStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    limit: number,
    locale: string,
    priority: number,
    status: TierProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.limit = limit;
    this.locale = locale;
    this.priority = priority;
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

  canMoveTo(next: TierProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "cancelled";
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

  moveTo(next: TierProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round(this.limit * this.priority * 100) / 100;
  }

  copy(): TierProposal {
    return new TierProposal(this.code, this.name, this.active, this.limit, this.locale, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tier proposal in status planned. */
export function newTierProposal(code: string, name: string): TierProposal {
  return new TierProposal(code, name, false, 0, "", 0, "planned");
}
