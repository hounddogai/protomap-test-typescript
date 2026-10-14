import * as text from "../../../../kit/text.js";

/** Where a rolling deflection claim is in its life cycle. */
export type RollingDeflectionClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One rolling deflection claim, with what the planners need to act on it. */
export class RollingDeflectionClaim {
  code: string;
  title: string;
  endsAt: number;
  journeyId: string;
  active: boolean;
  summary: string;
  clicks: number;
  budget: number;
  graceDays: number;
  capacity: number;
  status: RollingDeflectionClaimStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    journeyId: string,
    active: boolean,
    summary: string,
    clicks: number,
    budget: number,
    graceDays: number,
    capacity: number,
    status: RollingDeflectionClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.journeyId = journeyId;
    this.active = active;
    this.summary = summary;
    this.clicks = clicks;
    this.budget = budget;
    this.graceDays = graceDays;
    this.capacity = capacity;
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

  canMoveTo(next: RollingDeflectionClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingDeflectionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling deflection claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling deflection claim"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.graceDays * this.budget * 100) / 100;
  }

  copy(): RollingDeflectionClaim {
    return new RollingDeflectionClaim(
      this.code,
      this.title,
      this.endsAt,
      this.journeyId,
      this.active,
      this.summary,
      this.clicks,
      this.budget,
      this.graceDays,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling deflection claim in status open. */
export function newRollingDeflectionClaim(code: string, title: string): RollingDeflectionClaim {
  return new RollingDeflectionClaim(code, title, 0, "", false, "", 0, 0, 0, 0, "open");
}
