import * as text from "../../../../kit/text.js";

/** Where a regional placement template is in its life cycle. */
export type RegionalPlacementTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional placement template as the placement team keeps it. */
export class RegionalPlacementTemplate {
  code: string;
  title: string;
  reviewer: string;
  ownerId: string;
  budget: number;
  minimum: number;
  impressions: number;
  journeyId: string;
  status: RegionalPlacementTemplateStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    ownerId: string,
    budget: number,
    minimum: number,
    impressions: number,
    journeyId: string,
    status: RegionalPlacementTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.ownerId = ownerId;
    this.budget = budget;
    this.minimum = minimum;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPlacementTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalPlacementTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional placement template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional placement template"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.minimum + this.budget) * 100) / 100;
  }

  copy(): RegionalPlacementTemplate {
    return new RegionalPlacementTemplate(
      this.code,
      this.title,
      this.reviewer,
      this.ownerId,
      this.budget,
      this.minimum,
      this.impressions,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional placement template in status new. */
export function newRegionalPlacementTemplate(code: string, title: string): RegionalPlacementTemplate {
  return new RegionalPlacementTemplate(code, title, "", "", 0, 0, 0, "", "new");
}
