import * as text from "../../../../kit/text.js";

/** Where a weighted escalation proposal is in its life cycle. */
export type WeightedEscalationProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted escalation proposal. Its code is unique within a tenant. */
export class WeightedEscalationProposal {
  code: string;
  title: string;
  contactEmail: string;
  channel: string;
  budget: number;
  quantity: number;
  visible: boolean;
  status: WeightedEscalationProposalStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    channel: string,
    budget: number,
    quantity: number,
    visible: boolean,
    status: WeightedEscalationProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.budget = budget;
    this.quantity = quantity;
    this.visible = visible;
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

  canMoveTo(next: WeightedEscalationProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedEscalationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted escalation proposal"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.quantity - this.budget) * 100) / 100;
  }

  copy(): WeightedEscalationProposal {
    return new WeightedEscalationProposal(
      this.code,
      this.title,
      this.contactEmail,
      this.channel,
      this.budget,
      this.quantity,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted escalation proposal in status draft. */
export function newWeightedEscalationProposal(code: string, title: string): WeightedEscalationProposal {
  return new WeightedEscalationProposal(code, title, "", "", 0, 0, false, "draft");
}
