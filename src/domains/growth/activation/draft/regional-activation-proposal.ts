import * as text from "../../../../kit/text.js";

/** Where a regional activation proposal is in its life cycle. */
export type RegionalActivationProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional activation proposal as the activation team keeps it. */
export class RegionalActivationProposal {
  code: string;
  label: string;
  expiresAt: number;
  variant: string;
  externalRef: string;
  cohort: string;
  ratio: number;
  locale: string;
  threshold: number;
  title: string;
  currency: string;
  status: RegionalActivationProposalStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    variant: string,
    externalRef: string,
    cohort: string,
    ratio: number,
    locale: string,
    threshold: number,
    title: string,
    currency: string,
    status: RegionalActivationProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.variant = variant;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.ratio = ratio;
    this.locale = locale;
    this.threshold = threshold;
    this.title = title;
    this.currency = currency;
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

  canMoveTo(next: RegionalActivationProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: RegionalActivationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional activation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional activation proposal"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.ratio + this.threshold) * 100) / 100;
  }

  copy(): RegionalActivationProposal {
    return new RegionalActivationProposal(
      this.code,
      this.label,
      this.expiresAt,
      this.variant,
      this.externalRef,
      this.cohort,
      this.ratio,
      this.locale,
      this.threshold,
      this.title,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional activation proposal in status idle. */
export function newRegionalActivationProposal(code: string, label: string): RegionalActivationProposal {
  return new RegionalActivationProposal(code, label, 0, "", "", "", 0, "", 0, "", "", "idle");
}
