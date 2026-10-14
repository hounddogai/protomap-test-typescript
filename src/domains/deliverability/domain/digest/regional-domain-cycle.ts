import * as text from "../../../../kit/text.js";

/** Where a regional domain cycle is in its life cycle. */
export type RegionalDomainCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional domain cycle as the domain team keeps it. */
export class RegionalDomainCycle {
  code: string;
  name: string;
  journeyId: string;
  startsAt: number;
  openRate: number;
  revision: number;
  amount: number;
  budget: number;
  graceDays: number;
  title: string;
  status: RegionalDomainCycleStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    startsAt: number,
    openRate: number,
    revision: number,
    amount: number,
    budget: number,
    graceDays: number,
    title: string,
    status: RegionalDomainCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.revision = revision;
    this.amount = amount;
    this.budget = budget;
    this.graceDays = graceDays;
    this.title = title;
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

  canMoveTo(next: RegionalDomainCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: RegionalDomainCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional domain cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.amount * this.graceDays * 100) / 100;
  }

  copy(): RegionalDomainCycle {
    return new RegionalDomainCycle(
      this.code,
      this.name,
      this.journeyId,
      this.startsAt,
      this.openRate,
      this.revision,
      this.amount,
      this.budget,
      this.graceDays,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional domain cycle in status idle. */
export function newRegionalDomainCycle(code: string, name: string): RegionalDomainCycle {
  return new RegionalDomainCycle(code, name, "", 0, 0, 0, 0, 0, 0, "", "idle");
}
