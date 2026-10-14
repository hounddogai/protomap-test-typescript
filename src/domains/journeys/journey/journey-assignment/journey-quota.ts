import * as text from "../../../../kit/text.js";

/** Where a journey quota is in its life cycle. */
export type JourneyQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a journey quota and its current status. */
export class JourneyQuota {
  code: string;
  label: string;
  score: number;
  openRate: number;
  impressions: number;
  reviewer: string;
  archived: boolean;
  active: boolean;
  status: JourneyQuotaStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    openRate: number,
    impressions: number,
    reviewer: string,
    archived: boolean,
    active: boolean,
    status: JourneyQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.openRate = openRate;
    this.impressions = impressions;
    this.reviewer = reviewer;
    this.archived = archived;
    this.active = active;
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

  canMoveTo(next: JourneyQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"journey quota"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.openRate * this.impressions * 100) / 100;
  }

  copy(): JourneyQuota {
    return new JourneyQuota(
      this.code,
      this.label,
      this.score,
      this.openRate,
      this.impressions,
      this.reviewer,
      this.archived,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey quota in status open. */
export function newJourneyQuota(code: string, label: string): JourneyQuota {
  return new JourneyQuota(code, label, 0, 0, 0, "", false, false, "open");
}
