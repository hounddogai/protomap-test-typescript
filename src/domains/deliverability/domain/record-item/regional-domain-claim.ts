import * as text from "../../../../kit/text.js";

/** Where a regional domain claim is in its life cycle. */
export type RegionalDomainClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a regional domain claim and its current status. */
export class RegionalDomainClaim {
  code: string;
  name: string;
  rate: number;
  discount: number;
  ceiling: number;
  reviewer: string;
  visible: boolean;
  status: RegionalDomainClaimStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    discount: number,
    ceiling: number,
    reviewer: string,
    visible: boolean,
    status: RegionalDomainClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.discount = discount;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
    this.visible = visible;
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

  canMoveTo(next: RegionalDomainClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalDomainClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional domain claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional domain claim"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.ceiling - this.rate) * 100) / 100;
  }

  copy(): RegionalDomainClaim {
    return new RegionalDomainClaim(
      this.code,
      this.name,
      this.rate,
      this.discount,
      this.ceiling,
      this.reviewer,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional domain claim in status idle. */
export function newRegionalDomainClaim(code: string, name: string): RegionalDomainClaim {
  return new RegionalDomainClaim(code, name, 0, 0, 0, "", false, "idle");
}
