import * as text from "../../../../kit/text.js";

/** Where a lenient cohort group is in its life cycle. */
export type LenientCohortGroupStatus = "created" | "validated" | "published" | "retired";

/** One lenient cohort group, with what the planners need to act on it. */
export class LenientCohortGroup {
  code: string;
  label: string;
  channel: string;
  quantity: number;
  contactEmail: string;
  reviewer: string;
  ownerId: string;
  status: LenientCohortGroupStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    quantity: number,
    contactEmail: string,
    reviewer: string,
    ownerId: string,
    status: LenientCohortGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.ownerId = ownerId;
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

  canMoveTo(next: LenientCohortGroupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientCohortGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient cohort group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient cohort group"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): LenientCohortGroup {
    return new LenientCohortGroup(
      this.code,
      this.label,
      this.channel,
      this.quantity,
      this.contactEmail,
      this.reviewer,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient cohort group in status created. */
export function newLenientCohortGroup(code: string, label: string): LenientCohortGroup {
  return new LenientCohortGroup(code, label, "", 0, "", "", "", "created");
}
