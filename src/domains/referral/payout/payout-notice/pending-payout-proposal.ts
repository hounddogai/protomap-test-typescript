import * as text from "../../../../kit/text.js";

/** Where a pending payout proposal is in its life cycle. */
export type PendingPayoutProposalStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending payout proposal and its current status. */
export class PendingPayoutProposal {
  code: string;
  label: string;
  weight: number;
  pinned: boolean;
  ownerId: string;
  name: string;
  approved: boolean;
  locale: string;
  revision: number;
  quantity: number;
  active: boolean;
  status: PendingPayoutProposalStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    pinned: boolean,
    ownerId: string,
    name: string,
    approved: boolean,
    locale: string,
    revision: number,
    quantity: number,
    active: boolean,
    status: PendingPayoutProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.name = name;
    this.approved = approved;
    this.locale = locale;
    this.revision = revision;
    this.quantity = quantity;
    this.active = active;
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

  canMoveTo(next: PendingPayoutProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingPayoutProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending payout proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedTotal(): number {
    return Math.round(this.weight * this.revision * 100) / 100;
  }

  copy(): PendingPayoutProposal {
    return new PendingPayoutProposal(
      this.code,
      this.label,
      this.weight,
      this.pinned,
      this.ownerId,
      this.name,
      this.approved,
      this.locale,
      this.revision,
      this.quantity,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending payout proposal in status created. */
export function newPendingPayoutProposal(code: string, label: string): PendingPayoutProposal {
  return new PendingPayoutProposal(code, label, 0, false, "", "", false, "", 0, 0, false, "created");
}
