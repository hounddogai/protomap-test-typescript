import * as text from "../../../../kit/text.js";

/** Where a seasonal touchpoint plan is in its life cycle. */
export type SeasonalTouchpointPlanStatus = "created" | "validated" | "published" | "retired";

/** One seasonal touchpoint plan, with what the planners need to act on it. */
export class SeasonalTouchpointPlan {
  code: string;
  title: string;
  country: string;
  segment: string;
  bid: number;
  tags: string[];
  status: SeasonalTouchpointPlanStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    segment: string,
    bid: number,
    tags: string[],
    status: SeasonalTouchpointPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.segment = segment;
    this.bid = bid;
    this.tags = tags;
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

  canMoveTo(next: SeasonalTouchpointPlanStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SeasonalTouchpointPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal touchpoint plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal touchpoint plan"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): SeasonalTouchpointPlan {
    return new SeasonalTouchpointPlan(
      this.code,
      this.title,
      this.country,
      this.segment,
      this.bid,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal touchpoint plan in status created. */
export function newSeasonalTouchpointPlan(code: string, title: string): SeasonalTouchpointPlan {
  return new SeasonalTouchpointPlan(code, title, "", "", 0, [], "created");
}
