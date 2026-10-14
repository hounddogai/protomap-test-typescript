import * as text from "../../../../kit/text.js";

/** Where a warmup proposal is in its life cycle. */
export type WarmupProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a warmup proposal and its current status. */
export class WarmupProposal {
  code: string;
  label: string;
  quantity: number;
  endsAt: number;
  margin: number;
  status: WarmupProposalStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    endsAt: number,
    margin: number,
    status: WarmupProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.endsAt = endsAt;
    this.margin = margin;
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

  canMoveTo(next: WarmupProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedLoad(): number {
    return Math.round(this.quantity * this.margin * 100) / 100;
  }

  copy(): WarmupProposal {
    return new WarmupProposal(this.code, this.label, this.quantity, this.endsAt, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a warmup proposal in status requested. */
export function newWarmupProposal(code: string, label: string): WarmupProposal {
  return new WarmupProposal(code, label, 0, 0, 0, "requested");
}
