import * as text from "../../../../kit/text.js";

/** Where a funnel claim is in its life cycle. */
export type FunnelClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A funnel claim. Its code is unique within a tenant. */
export class FunnelClaim {
  code: string;
  name: string;
  archived: boolean;
  frequencyCap: number;
  rate: number;
  revision: number;
  ratio: number;
  journeyId: string;
  discount: number;
  active: boolean;
  notes: string;
  status: FunnelClaimStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    frequencyCap: number,
    rate: number,
    revision: number,
    ratio: number,
    journeyId: string,
    discount: number,
    active: boolean,
    notes: string,
    status: FunnelClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.frequencyCap = frequencyCap;
    this.rate = rate;
    this.revision = revision;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.discount = discount;
    this.active = active;
    this.notes = notes;
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

  canMoveTo(next: FunnelClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FunnelClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.ratio - this.discount) * 100) / 100;
  }

  copy(): FunnelClaim {
    return new FunnelClaim(
      this.code,
      this.name,
      this.archived,
      this.frequencyCap,
      this.rate,
      this.revision,
      this.ratio,
      this.journeyId,
      this.discount,
      this.active,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel claim in status draft. */
export function newFunnelClaim(code: string, name: string): FunnelClaim {
  return new FunnelClaim(code, name, false, 0, 0, 0, 0, "", 0, false, "", "draft");
}
