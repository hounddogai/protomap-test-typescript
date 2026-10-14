import * as text from "../../../../kit/text.js";

/** Where a legacy sender assignment is in its life cycle. */
export type LegacySenderAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy sender assignment. Its code is unique within a tenant. */
export class LegacySenderAssignment {
  code: string;
  name: string;
  segment: string;
  cohort: string;
  sequence: number;
  locale: string;
  cost: number;
  label: string;
  contactEmail: string;
  journeyId: string;
  channel: string;
  status: LegacySenderAssignmentStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    cohort: string,
    sequence: number,
    locale: string,
    cost: number,
    label: string,
    contactEmail: string,
    journeyId: string,
    channel: string,
    status: LegacySenderAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.cohort = cohort;
    this.sequence = sequence;
    this.locale = locale;
    this.cost = cost;
    this.label = label;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.channel = channel;
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

  canMoveTo(next: LegacySenderAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacySenderAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy sender assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy sender assignment"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.sequence * this.cost * 100) / 100;
  }

  copy(): LegacySenderAssignment {
    return new LegacySenderAssignment(
      this.code,
      this.name,
      this.segment,
      this.cohort,
      this.sequence,
      this.locale,
      this.cost,
      this.label,
      this.contactEmail,
      this.journeyId,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy sender assignment in status draft. */
export function newLegacySenderAssignment(code: string, name: string): LegacySenderAssignment {
  return new LegacySenderAssignment(code, name, "", "", 0, "", 0, "", "", "", "", "draft");
}
