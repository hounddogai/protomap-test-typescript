import * as text from "../../../../kit/text.js";

/** Where a rolling journey assignment is in its life cycle. */
export type RollingJourneyAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling journey assignment as the journey team keeps it. */
export class RollingJourneyAssignment {
  code: string;
  title: string;
  description: string;
  startsAt: number;
  revision: number;
  externalRef: string;
  cost: number;
  maximum: number;
  locale: string;
  limit: number;
  clicks: number;
  status: RollingJourneyAssignmentStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    startsAt: number,
    revision: number,
    externalRef: string,
    cost: number,
    maximum: number,
    locale: string,
    limit: number,
    clicks: number,
    status: RollingJourneyAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.startsAt = startsAt;
    this.revision = revision;
    this.externalRef = externalRef;
    this.cost = cost;
    this.maximum = maximum;
    this.locale = locale;
    this.limit = limit;
    this.clicks = clicks;
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

  canMoveTo(next: RollingJourneyAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingJourneyAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling journey assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"rolling journey assignment"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.limit + this.cost) * 100) / 100;
  }

  copy(): RollingJourneyAssignment {
    return new RollingJourneyAssignment(
      this.code,
      this.title,
      this.description,
      this.startsAt,
      this.revision,
      this.externalRef,
      this.cost,
      this.maximum,
      this.locale,
      this.limit,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling journey assignment in status proposed. */
export function newRollingJourneyAssignment(code: string, title: string): RollingJourneyAssignment {
  return new RollingJourneyAssignment(code, title, "", 0, 0, "", 0, 0, "", 0, 0, "proposed");
}
