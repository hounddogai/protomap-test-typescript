import * as text from "../../../../kit/text.js";

/** Where a weighted ticket view cycle is in its life cycle. */
export type WeightedTicketViewCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a weighted ticket view cycle and its current status. */
export class WeightedTicketViewCycle {
  code: string;
  label: string;
  country: string;
  channel: string;
  checksum: string;
  approved: boolean;
  maximum: number;
  ownerId: string;
  status: WeightedTicketViewCycleStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    channel: string,
    checksum: string,
    approved: boolean,
    maximum: number,
    ownerId: string,
    status: WeightedTicketViewCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.channel = channel;
    this.checksum = checksum;
    this.approved = approved;
    this.maximum = maximum;
    this.ownerId = ownerId;
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

  canMoveTo(next: WeightedTicketViewCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedTicketViewCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted ticket view cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): WeightedTicketViewCycle {
    return new WeightedTicketViewCycle(
      this.code,
      this.label,
      this.country,
      this.channel,
      this.checksum,
      this.approved,
      this.maximum,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted ticket view cycle in status draft. */
export function newWeightedTicketViewCycle(code: string, label: string): WeightedTicketViewCycle {
  return new WeightedTicketViewCycle(code, label, "", "", "", false, 0, "", "draft");
}
