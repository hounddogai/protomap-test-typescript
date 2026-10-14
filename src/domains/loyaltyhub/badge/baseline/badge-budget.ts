import * as text from "../../../../kit/text.js";

/** Where a badge budget is in its life cycle. */
export type BadgeBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A badge budget as the badge team keeps it. */
export class BadgeBudget {
  code: string;
  label: string;
  journeyId: string;
  name: string;
  title: string;
  createdAt: number;
  clicks: number;
  campaignRef: string;
  updatedAt: number;
  status: BadgeBudgetStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    name: string,
    title: string,
    createdAt: number,
    clicks: number,
    campaignRef: string,
    updatedAt: number,
    status: BadgeBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.name = name;
    this.title = title;
    this.createdAt = createdAt;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"badge budget"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.updatedAt * this.clicks * 100) / 100;
  }

  copy(): BadgeBudget {
    return new BadgeBudget(
      this.code,
      this.label,
      this.journeyId,
      this.name,
      this.title,
      this.createdAt,
      this.clicks,
      this.campaignRef,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a badge budget in status planned. */
export function newBadgeBudget(code: string, label: string): BadgeBudget {
  return new BadgeBudget(code, label, "", "", "", 0, 0, "", 0, "planned");
}
