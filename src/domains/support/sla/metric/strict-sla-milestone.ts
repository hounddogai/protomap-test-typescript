import * as text from "../../../../kit/text.js";

/** Where a strict sla milestone is in its life cycle. */
export type StrictSlaMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A strict sla milestone as the sla team keeps it. */
export class StrictSlaMilestone {
  code: string;
  name: string;
  contactEmail: string;
  attempts: number;
  frequencyCap: number;
  createdAt: number;
  status: StrictSlaMilestoneStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    attempts: number,
    frequencyCap: number,
    createdAt: number,
    status: StrictSlaMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictSlaMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictSlaMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict sla milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedVolume(): number {
    return Math.round((this.frequencyCap - this.attempts) * 100) / 100;
  }

  copy(): StrictSlaMilestone {
    return new StrictSlaMilestone(
      this.code,
      this.name,
      this.contactEmail,
      this.attempts,
      this.frequencyCap,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict sla milestone in status proposed. */
export function newStrictSlaMilestone(code: string, name: string): StrictSlaMilestone {
  return new StrictSlaMilestone(code, name, "", 0, 0, 0, "proposed");
}
