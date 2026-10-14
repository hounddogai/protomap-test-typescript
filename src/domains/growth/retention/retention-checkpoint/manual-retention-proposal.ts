import * as text from "../../../../kit/text.js";

/** Where a manual retention proposal is in its life cycle. */
export type ManualRetentionProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual retention proposal as the retention team keeps it. */
export class ManualRetentionProposal {
  code: string;
  title: string;
  limit: number;
  floorValue: number;
  sendAt: number;
  status: ManualRetentionProposalStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    floorValue: number,
    sendAt: number,
    status: ManualRetentionProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
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

  canMoveTo(next: ManualRetentionProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRetentionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual retention proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedValue(): number {
    return Math.round((this.limit - this.floorValue) * 100) / 100;
  }

  copy(): ManualRetentionProposal {
    return new ManualRetentionProposal(this.code, this.title, this.limit, this.floorValue, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual retention proposal in status idle. */
export function newManualRetentionProposal(code: string, title: string): ManualRetentionProposal {
  return new ManualRetentionProposal(code, title, 0, 0, 0, "idle");
}
