import * as text from "../../../../kit/text.js";

/** Where a manual ticket view assignment is in its life cycle. */
export type ManualTicketViewAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual ticket view assignment. Its code is unique within a tenant. */
export class ManualTicketViewAssignment {
  code: string;
  title: string;
  timezone: string;
  ownerId: string;
  ceiling: number;
  budget: number;
  margin: number;
  label: string;
  weight: number;
  status: ManualTicketViewAssignmentStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    ownerId: string,
    ceiling: number,
    budget: number,
    margin: number,
    label: string,
    weight: number,
    status: ManualTicketViewAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.budget = budget;
    this.margin = margin;
    this.label = label;
    this.weight = weight;
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

  canMoveTo(next: ManualTicketViewAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualTicketViewAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual ticket view assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual ticket view assignment"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.weight - this.budget) * 100) / 100;
  }

  copy(): ManualTicketViewAssignment {
    return new ManualTicketViewAssignment(
      this.code,
      this.title,
      this.timezone,
      this.ownerId,
      this.ceiling,
      this.budget,
      this.margin,
      this.label,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual ticket view assignment in status requested. */
export function newManualTicketViewAssignment(code: string, title: string): ManualTicketViewAssignment {
  return new ManualTicketViewAssignment(code, title, "", "", 0, 0, 0, "", 0, "requested");
}
