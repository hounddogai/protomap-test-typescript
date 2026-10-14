import * as text from "../../../../kit/text.js";

/** Where a ticket view cycle is in its life cycle. */
export type TicketViewCycleStatus = "created" | "validated" | "published" | "retired";

/** A ticket view cycle as the ticket view team keeps it. */
export class TicketViewCycle {
  code: string;
  title: string;
  checksum: string;
  createdAt: number;
  cohort: string;
  budget: number;
  retries: number;
  campaignRef: string;
  region: string;
  startsAt: number;
  active: boolean;
  status: TicketViewCycleStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    createdAt: number,
    cohort: string,
    budget: number,
    retries: number,
    campaignRef: string,
    region: string,
    startsAt: number,
    active: boolean,
    status: TicketViewCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.createdAt = createdAt;
    this.cohort = cohort;
    this.budget = budget;
    this.retries = retries;
    this.campaignRef = campaignRef;
    this.region = region;
    this.startsAt = startsAt;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewCycleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.retries + this.budget) * 100) / 100;
  }

  copy(): TicketViewCycle {
    return new TicketViewCycle(
      this.code,
      this.title,
      this.checksum,
      this.createdAt,
      this.cohort,
      this.budget,
      this.retries,
      this.campaignRef,
      this.region,
      this.startsAt,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a ticket view cycle in status created. */
export function newTicketViewCycle(code: string, title: string): TicketViewCycle {
  return new TicketViewCycle(code, title, "", 0, "", 0, 0, "", "", 0, false, "created");
}
