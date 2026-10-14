import * as text from "../../../../kit/text.js";

/** Where a domain milestone is in its life cycle. */
export type DomainMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a domain milestone and its current status. */
export class DomainMilestone {
  code: string;
  name: string;
  revision: number;
  minimum: number;
  limit: number;
  sendAt: number;
  status: DomainMilestoneStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    minimum: number,
    limit: number,
    sendAt: number,
    status: DomainMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.minimum = minimum;
    this.limit = limit;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DomainMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round(this.revision * this.sendAt * 100) / 100;
  }

  copy(): DomainMilestone {
    return new DomainMilestone(this.code, this.name, this.revision, this.minimum, this.limit, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a domain milestone in status open. */
export function newDomainMilestone(code: string, name: string): DomainMilestone {
  return new DomainMilestone(code, name, 0, 0, 0, 0, "open");
}
