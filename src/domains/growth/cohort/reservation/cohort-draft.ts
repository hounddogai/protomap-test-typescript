import * as text from "../../../../kit/text.js";

/** Where a cohort draft is in its life cycle. */
export type CohortDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A cohort draft as the cohort team keeps it. */
export class CohortDraft {
  code: string;
  title: string;
  impressions: number;
  audienceId: string;
  phone: string;
  createdAt: number;
  amount: number;
  weight: number;
  approved: boolean;
  status: CohortDraftStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    audienceId: string,
    phone: string,
    createdAt: number,
    amount: number,
    weight: number,
    approved: boolean,
    status: CohortDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.phone = phone;
    this.createdAt = createdAt;
    this.amount = amount;
    this.weight = weight;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"cohort draft"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.impressions * this.createdAt * 100) / 100;
  }

  copy(): CohortDraft {
    return new CohortDraft(
      this.code,
      this.title,
      this.impressions,
      this.audienceId,
      this.phone,
      this.createdAt,
      this.amount,
      this.weight,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a cohort draft in status idle. */
export function newCohortDraft(code: string, title: string): CohortDraft {
  return new CohortDraft(code, title, 0, "", "", 0, 0, 0, false, "idle");
}
