import * as text from "../../../../kit/text.js";

/** Where a flight proposal is in its life cycle. */
export type FlightProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a flight proposal and its current status. */
export class FlightProposal {
  code: string;
  label: string;
  locale: string;
  variant: string;
  budget: number;
  frequencyCap: number;
  margin: number;
  status: FlightProposalStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    variant: string,
    budget: number,
    frequencyCap: number,
    margin: number,
    status: FlightProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.variant = variant;
    this.budget = budget;
    this.frequencyCap = frequencyCap;
    this.margin = margin;
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

  canMoveTo(next: FlightProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"flight proposal"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.margin - this.budget) * 100) / 100;
  }

  copy(): FlightProposal {
    return new FlightProposal(
      this.code,
      this.label,
      this.locale,
      this.variant,
      this.budget,
      this.frequencyCap,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight proposal in status idle. */
export function newFlightProposal(code: string, label: string): FlightProposal {
  return new FlightProposal(code, label, "", "", 0, 0, 0, "idle");
}
