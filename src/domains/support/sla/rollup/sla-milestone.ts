import * as text from "../../../../kit/text.js";

/** Where a sla milestone is in its life cycle. */
export type SlaMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a sla milestone and its current status. */
export class SlaMilestone {
  code: string;
  name: string;
  clicks: number;
  margin: number;
  budget: number;
  externalRef: string;
  status: SlaMilestoneStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    margin: number,
    budget: number,
    externalRef: string,
    status: SlaMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.margin = margin;
    this.budget = budget;
    this.externalRef = externalRef;
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

  canMoveTo(next: SlaMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sla milestone"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.clicks + this.budget) * 100) / 100;
  }

  copy(): SlaMilestone {
    return new SlaMilestone(this.code, this.name, this.clicks, this.margin, this.budget, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sla milestone in status requested. */
export function newSlaMilestone(code: string, name: string): SlaMilestone {
  return new SlaMilestone(code, name, 0, 0, 0, "", "requested");
}
