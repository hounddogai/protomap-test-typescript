import * as text from "../../../../kit/text.js";

/** Where a seasonal complaint agreement is in its life cycle. */
export type SeasonalComplaintAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal complaint agreement as the complaint team keeps it. */
export class SeasonalComplaintAgreement {
  code: string;
  name: string;
  endsAt: number;
  category: string;
  description: string;
  budget: number;
  status: SeasonalComplaintAgreementStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    category: string,
    description: string,
    budget: number,
    status: SeasonalComplaintAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.category = category;
    this.description = description;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalComplaintAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalComplaintAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal complaint agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"seasonal complaint agreement"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.endsAt + this.budget) * 100) / 100;
  }

  copy(): SeasonalComplaintAgreement {
    return new SeasonalComplaintAgreement(
      this.code,
      this.name,
      this.endsAt,
      this.category,
      this.description,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal complaint agreement in status idle. */
export function newSeasonalComplaintAgreement(code: string, name: string): SeasonalComplaintAgreement {
  return new SeasonalComplaintAgreement(code, name, 0, "", "", 0, "idle");
}
