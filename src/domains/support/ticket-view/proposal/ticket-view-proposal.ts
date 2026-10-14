/**
 * The ticket view proposal records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view proposal is in its life cycle. */
export type TicketViewProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A ticket view proposal. Its code is unique within a tenant. */
export class TicketViewProposal {
  code: string;
  label: string;
  batchSize: number;
  campaignRef: string;
  title: string;
  reviewer: string;
  status: TicketViewProposalStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    campaignRef: string,
    title: string,
    reviewer: string,
    status: TicketViewProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.title = title;
    this.reviewer = reviewer;
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

  canMoveTo(next: TicketViewProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): TicketViewProposal {
    return new TicketViewProposal(
      this.code,
      this.label,
      this.batchSize,
      this.campaignRef,
      this.title,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a ticket view proposal in status draft. */
export function newTicketViewProposal(code: string, label: string): TicketViewProposal {
  return new TicketViewProposal(code, label, 0, "", "", "", "draft");
}
