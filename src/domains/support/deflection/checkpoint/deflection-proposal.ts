import * as text from "../../../../kit/text.js";

/** Where a deflection proposal is in its life cycle. */
export type DeflectionProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A deflection proposal. Its code is unique within a tenant. */
export class DeflectionProposal {
  code: string;
  name: string;
  pinned: boolean;
  version: number;
  ownerId: string;
  score: number;
  sendAt: number;
  country: string;
  startsAt: number;
  unit: string;
  status: DeflectionProposalStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    version: number,
    ownerId: string,
    score: number,
    sendAt: number,
    country: string,
    startsAt: number,
    unit: string,
    status: DeflectionProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.version = version;
    this.ownerId = ownerId;
    this.score = score;
    this.sendAt = sendAt;
    this.country = country;
    this.startsAt = startsAt;
    this.unit = unit;
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

  canMoveTo(next: DeflectionProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DeflectionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"deflection proposal"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.sendAt + this.startsAt) * 100) / 100;
  }

  copy(): DeflectionProposal {
    return new DeflectionProposal(
      this.code,
      this.name,
      this.pinned,
      this.version,
      this.ownerId,
      this.score,
      this.sendAt,
      this.country,
      this.startsAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a deflection proposal in status idle. */
export function newDeflectionProposal(code: string, name: string): DeflectionProposal {
  return new DeflectionProposal(code, name, false, 0, "", 0, 0, "", 0, "", "idle");
}
