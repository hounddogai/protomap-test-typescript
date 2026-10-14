import * as text from "../../../../kit/text.js";

/** Where a tier milestone is in its life cycle. */
export type TierMilestoneStatus = "created" | "validated" | "published" | "retired";

/** A tier milestone as the tier team keeps it. */
export class TierMilestone {
  code: string;
  title: string;
  timezone: string;
  journeyId: string;
  contactEmail: string;
  maximum: number;
  budget: number;
  status: TierMilestoneStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    journeyId: string,
    contactEmail: string,
    maximum: number,
    budget: number,
    status: TierMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.budget = budget;
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

  canMoveTo(next: TierMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
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

  moveTo(next: TierMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.budget * this.maximum * 100) / 100;
  }

  copy(): TierMilestone {
    return new TierMilestone(
      this.code,
      this.title,
      this.timezone,
      this.journeyId,
      this.contactEmail,
      this.maximum,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tier milestone in status created. */
export function newTierMilestone(code: string, title: string): TierMilestone {
  return new TierMilestone(code, title, "", "", "", 0, 0, "created");
}
