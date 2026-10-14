import * as text from "../../../../kit/text.js";

/** Where a seasonal touchpoint milestone is in its life cycle. */
export type SeasonalTouchpointMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal touchpoint milestone as the touchpoint team keeps it. */
export class SeasonalTouchpointMilestone {
  code: string;
  title: string;
  source: string;
  description: string;
  segment: string;
  locale: string;
  contactEmail: string;
  endsAt: number;
  createdAt: number;
  name: string;
  floorValue: number;
  status: SeasonalTouchpointMilestoneStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    description: string,
    segment: string,
    locale: string,
    contactEmail: string,
    endsAt: number,
    createdAt: number,
    name: string,
    floorValue: number,
    status: SeasonalTouchpointMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.description = description;
    this.segment = segment;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.endsAt = endsAt;
    this.createdAt = createdAt;
    this.name = name;
    this.floorValue = floorValue;
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

  canMoveTo(next: SeasonalTouchpointMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalTouchpointMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal touchpoint milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedExposure(): number {
    return Math.round(this.endsAt * this.floorValue * 100) / 100;
  }

  copy(): SeasonalTouchpointMilestone {
    return new SeasonalTouchpointMilestone(
      this.code,
      this.title,
      this.source,
      this.description,
      this.segment,
      this.locale,
      this.contactEmail,
      this.endsAt,
      this.createdAt,
      this.name,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal touchpoint milestone in status draft. */
export function newSeasonalTouchpointMilestone(code: string, title: string): SeasonalTouchpointMilestone {
  return new SeasonalTouchpointMilestone(code, title, "", "", "", "", "", 0, 0, "", 0, "draft");
}
