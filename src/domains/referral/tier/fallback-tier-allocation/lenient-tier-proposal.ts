import * as text from "../../../../kit/text.js";

/** Where a lenient tier proposal is in its life cycle. */
export type LenientTierProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient tier proposal as the tier team keeps it. */
export class LenientTierProposal {
  code: string;
  name: string;
  cohort: string;
  source: string;
  windowDays: number;
  country: string;
  status: LenientTierProposalStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    source: string,
    windowDays: number,
    country: string,
    status: LenientTierProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.source = source;
    this.windowDays = windowDays;
    this.country = country;
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

  canMoveTo(next: LenientTierProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
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
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientTierProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient tier proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): LenientTierProposal {
    return new LenientTierProposal(
      this.code,
      this.name,
      this.cohort,
      this.source,
      this.windowDays,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient tier proposal in status planned. */
export function newLenientTierProposal(code: string, name: string): LenientTierProposal {
  return new LenientTierProposal(code, name, "", "", 0, "", "planned");
}
