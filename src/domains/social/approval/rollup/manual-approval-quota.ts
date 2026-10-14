import * as text from "../../../../kit/text.js";

/** Where a manual approval quota is in its life cycle. */
export type ManualApprovalQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One manual approval quota, with what the planners need to act on it. */
export class ManualApprovalQuota {
  code: string;
  label: string;
  budget: number;
  timezone: string;
  locale: string;
  journeyId: string;
  threshold: number;
  unit: string;
  externalRef: string;
  sequence: number;
  status: ManualApprovalQuotaStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    timezone: string,
    locale: string,
    journeyId: string,
    threshold: number,
    unit: string,
    externalRef: string,
    sequence: number,
    status: ManualApprovalQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.timezone = timezone;
    this.locale = locale;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.unit = unit;
    this.externalRef = externalRef;
    this.sequence = sequence;
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

  canMoveTo(next: ManualApprovalQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualApprovalQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual approval quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.sequence * this.threshold * 100) / 100;
  }

  copy(): ManualApprovalQuota {
    return new ManualApprovalQuota(
      this.code,
      this.label,
      this.budget,
      this.timezone,
      this.locale,
      this.journeyId,
      this.threshold,
      this.unit,
      this.externalRef,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual approval quota in status idle. */
export function newManualApprovalQuota(code: string, label: string): ManualApprovalQuota {
  return new ManualApprovalQuota(code, label, 0, "", "", "", 0, "", "", 0, "idle");
}
