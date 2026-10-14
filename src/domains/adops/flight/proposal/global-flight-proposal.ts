/**
 * The global flight proposal records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global flight proposal is in its life cycle. */
export type GlobalFlightProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global flight proposal as the flight team keeps it. */
export class GlobalFlightProposal {
  code: string;
  name: string;
  description: string;
  notes: string;
  title: string;
  contactEmail: string;
  score: number;
  status: GlobalFlightProposalStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    notes: string,
    title: string,
    contactEmail: string,
    score: number,
    status: GlobalFlightProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.notes = notes;
    this.title = title;
    this.contactEmail = contactEmail;
    this.score = score;
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

  canMoveTo(next: GlobalFlightProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
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

  moveTo(next: GlobalFlightProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global flight proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): GlobalFlightProposal {
    return new GlobalFlightProposal(
      this.code,
      this.name,
      this.description,
      this.notes,
      this.title,
      this.contactEmail,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global flight proposal in status planned. */
export function newGlobalFlightProposal(code: string, name: string): GlobalFlightProposal {
  return new GlobalFlightProposal(code, name, "", "", "", "", 0, "planned");
}
