import * as text from "../../../../kit/text.js";

/** Where a opt out proposal is in its life cycle. */
export type OptOutProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** One opt out proposal, with what the planners need to act on it. */
export class OptOutProposal {
  code: string;
  label: string;
  graceDays: number;
  capacity: number;
  sendAt: number;
  endsAt: number;
  batchSize: number;
  ownerId: string;
  revision: number;
  weight: number;
  status: OptOutProposalStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    capacity: number,
    sendAt: number,
    endsAt: number,
    batchSize: number,
    ownerId: string,
    revision: number,
    weight: number,
    status: OptOutProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
    this.revision = revision;
    this.weight = weight;
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

  canMoveTo(next: OptOutProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: OptOutProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"opt out proposal"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.batchSize - this.graceDays) * 100) / 100;
  }

  copy(): OptOutProposal {
    return new OptOutProposal(
      this.code,
      this.label,
      this.graceDays,
      this.capacity,
      this.sendAt,
      this.endsAt,
      this.batchSize,
      this.ownerId,
      this.revision,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a opt out proposal in status requested. */
export function newOptOutProposal(code: string, label: string): OptOutProposal {
  return new OptOutProposal(code, label, 0, 0, 0, 0, 0, "", 0, 0, "requested");
}
