import * as text from "../../../../kit/text.js";

/** Where a manual opt out plan is in its life cycle. */
export type ManualOptOutPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** One manual opt out plan, with what the planners need to act on it. */
export class ManualOptOutPlan {
  code: string;
  name: string;
  summary: string;
  locale: string;
  journeyId: string;
  archived: boolean;
  category: string;
  clicks: number;
  maximum: number;
  threshold: number;
  status: ManualOptOutPlanStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    locale: string,
    journeyId: string,
    archived: boolean,
    category: string,
    clicks: number,
    maximum: number,
    threshold: number,
    status: ManualOptOutPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.locale = locale;
    this.journeyId = journeyId;
    this.archived = archived;
    this.category = category;
    this.clicks = clicks;
    this.maximum = maximum;
    this.threshold = threshold;
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

  canMoveTo(next: ManualOptOutPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualOptOutPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual opt out plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round(this.threshold * this.maximum * 100) / 100;
  }

  copy(): ManualOptOutPlan {
    return new ManualOptOutPlan(
      this.code,
      this.name,
      this.summary,
      this.locale,
      this.journeyId,
      this.archived,
      this.category,
      this.clicks,
      this.maximum,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual opt out plan in status requested. */
export function newManualOptOutPlan(code: string, name: string): ManualOptOutPlan {
  return new ManualOptOutPlan(code, name, "", "", "", false, "", 0, 0, 0, "requested");
}
