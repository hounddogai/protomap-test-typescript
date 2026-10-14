import * as text from "../../../../kit/text.js";

/** Where a adaptive badge quota is in its life cycle. */
export type AdaptiveBadgeQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One adaptive badge quota, with what the planners need to act on it. */
export class AdaptiveBadgeQuota {
  code: string;
  label: string;
  budget: number;
  retries: number;
  revision: number;
  variant: string;
  summary: string;
  externalRef: string;
  audienceId: string;
  status: AdaptiveBadgeQuotaStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    retries: number,
    revision: number,
    variant: string,
    summary: string,
    externalRef: string,
    audienceId: string,
    status: AdaptiveBadgeQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.retries = retries;
    this.revision = revision;
    this.variant = variant;
    this.summary = summary;
    this.externalRef = externalRef;
    this.audienceId = audienceId;
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

  canMoveTo(next: AdaptiveBadgeQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBadgeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive badge quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"adaptive badge quota"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.revision + this.budget) * 100) / 100;
  }

  copy(): AdaptiveBadgeQuota {
    return new AdaptiveBadgeQuota(
      this.code,
      this.label,
      this.budget,
      this.retries,
      this.revision,
      this.variant,
      this.summary,
      this.externalRef,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive badge quota in status proposed. */
export function newAdaptiveBadgeQuota(code: string, label: string): AdaptiveBadgeQuota {
  return new AdaptiveBadgeQuota(code, label, 0, 0, 0, "", "", "", "", "proposed");
}
