import * as text from "../../../../kit/text.js";

/** Where a wait proposal is in its life cycle. */
export type WaitProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A wait proposal as the wait team keeps it. */
export class WaitProposal {
  code: string;
  name: string;
  discount: number;
  minimum: number;
  cost: number;
  timezone: string;
  impressions: number;
  status: WaitProposalStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    minimum: number,
    cost: number,
    timezone: string,
    impressions: number,
    status: WaitProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.minimum = minimum;
    this.cost = cost;
    this.timezone = timezone;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WaitProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.cost + this.minimum) * 100) / 100;
  }

  copy(): WaitProposal {
    return new WaitProposal(
      this.code,
      this.name,
      this.discount,
      this.minimum,
      this.cost,
      this.timezone,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a wait proposal in status requested. */
export function newWaitProposal(code: string, name: string): WaitProposal {
  return new WaitProposal(code, name, 0, 0, 0, "", 0, "requested");
}
