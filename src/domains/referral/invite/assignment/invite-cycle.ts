import * as text from "../../../../kit/text.js";

/** Where a invite cycle is in its life cycle. */
export type InviteCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A invite cycle as the invite team keeps it. */
export class InviteCycle {
  code: string;
  label: string;
  journeyId: string;
  reviewer: string;
  frequencyCap: number;
  name: string;
  variant: string;
  country: string;
  version: number;
  openRate: number;
  status: InviteCycleStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    reviewer: string,
    frequencyCap: number,
    name: string,
    variant: string,
    country: string,
    version: number,
    openRate: number,
    status: InviteCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.name = name;
    this.variant = variant;
    this.country = country;
    this.version = version;
    this.openRate = openRate;
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

  canMoveTo(next: InviteCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: InviteCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.version * this.frequencyCap * 100) / 100;
  }

  copy(): InviteCycle {
    return new InviteCycle(
      this.code,
      this.label,
      this.journeyId,
      this.reviewer,
      this.frequencyCap,
      this.name,
      this.variant,
      this.country,
      this.version,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a invite cycle in status idle. */
export function newInviteCycle(code: string, label: string): InviteCycle {
  return new InviteCycle(code, label, "", "", 0, "", "", "", 0, 0, "idle");
}
