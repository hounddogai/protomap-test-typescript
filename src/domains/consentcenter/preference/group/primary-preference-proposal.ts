import * as text from "../../../../kit/text.js";

/** Where a primary preference proposal is in its life cycle. */
export type PrimaryPreferenceProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary preference proposal and its current status. */
export class PrimaryPreferenceProposal {
  code: string;
  name: string;
  description: string;
  clicks: number;
  summary: string;
  currency: string;
  channel: string;
  quantity: number;
  minimum: number;
  status: PrimaryPreferenceProposalStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    clicks: number,
    summary: string,
    currency: string,
    channel: string,
    quantity: number,
    minimum: number,
    status: PrimaryPreferenceProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.clicks = clicks;
    this.summary = summary;
    this.currency = currency;
    this.channel = channel;
    this.quantity = quantity;
    this.minimum = minimum;
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

  canMoveTo(next: PrimaryPreferenceProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PrimaryPreferenceProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary preference proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary preference proposal"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.quantity - this.clicks) * 100) / 100;
  }

  copy(): PrimaryPreferenceProposal {
    return new PrimaryPreferenceProposal(
      this.code,
      this.name,
      this.description,
      this.clicks,
      this.summary,
      this.currency,
      this.channel,
      this.quantity,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary preference proposal in status planned. */
export function newPrimaryPreferenceProposal(code: string, name: string): PrimaryPreferenceProposal {
  return new PrimaryPreferenceProposal(code, name, "", 0, "", "", "", 0, 0, "planned");
}
