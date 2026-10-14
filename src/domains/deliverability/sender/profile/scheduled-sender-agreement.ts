import * as text from "../../../../kit/text.js";

/** Where a scheduled sender agreement is in its life cycle. */
export type ScheduledSenderAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled sender agreement as the sender team keeps it. */
export class ScheduledSenderAgreement {
  code: string;
  label: string;
  description: string;
  cost: number;
  variant: string;
  floorValue: number;
  frequencyCap: number;
  budget: number;
  clicks: number;
  amount: number;
  status: ScheduledSenderAgreementStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    cost: number,
    variant: string,
    floorValue: number,
    frequencyCap: number,
    budget: number,
    clicks: number,
    amount: number,
    status: ScheduledSenderAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.cost = cost;
    this.variant = variant;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.clicks = clicks;
    this.amount = amount;
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

  canMoveTo(next: ScheduledSenderAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
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

  moveTo(next: ScheduledSenderAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sender agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled sender agreement"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.cost * this.frequencyCap * 100) / 100;
  }

  copy(): ScheduledSenderAgreement {
    return new ScheduledSenderAgreement(
      this.code,
      this.label,
      this.description,
      this.cost,
      this.variant,
      this.floorValue,
      this.frequencyCap,
      this.budget,
      this.clicks,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled sender agreement in status proposed. */
export function newScheduledSenderAgreement(code: string, label: string): ScheduledSenderAgreement {
  return new ScheduledSenderAgreement(code, label, "", 0, "", 0, 0, 0, 0, 0, "proposed");
}
