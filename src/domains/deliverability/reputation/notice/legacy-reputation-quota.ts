import * as text from "../../../../kit/text.js";

/** Where a legacy reputation quota is in its life cycle. */
export type LegacyReputationQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy reputation quota. Its code is unique within a tenant. */
export class LegacyReputationQuota {
  code: string;
  label: string;
  active: boolean;
  budget: number;
  notes: string;
  retries: number;
  country: string;
  audienceId: string;
  frequencyCap: number;
  status: LegacyReputationQuotaStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    budget: number,
    notes: string,
    retries: number,
    country: string,
    audienceId: string,
    frequencyCap: number,
    status: LegacyReputationQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.budget = budget;
    this.notes = notes;
    this.retries = retries;
    this.country = country;
    this.audienceId = audienceId;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: LegacyReputationQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyReputationQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reputation quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round(this.retries * this.budget * 100) / 100;
  }

  copy(): LegacyReputationQuota {
    return new LegacyReputationQuota(
      this.code,
      this.label,
      this.active,
      this.budget,
      this.notes,
      this.retries,
      this.country,
      this.audienceId,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy reputation quota in status draft. */
export function newLegacyReputationQuota(code: string, label: string): LegacyReputationQuota {
  return new LegacyReputationQuota(code, label, false, 0, "", 0, "", "", 0, "draft");
}
