import * as text from "../../../../kit/text.js";

/** Where a sla agreement is in its life cycle. */
export type SlaAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A sla agreement. Its code is unique within a tenant. */
export class SlaAgreement {
  code: string;
  label: string;
  impressions: number;
  phone: string;
  minimum: number;
  retries: number;
  amount: number;
  title: string;
  margin: number;
  clicks: number;
  description: string;
  status: SlaAgreementStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    phone: string,
    minimum: number,
    retries: number,
    amount: number,
    title: string,
    margin: number,
    clicks: number,
    description: string,
    status: SlaAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.phone = phone;
    this.minimum = minimum;
    this.retries = retries;
    this.amount = amount;
    this.title = title;
    this.margin = margin;
    this.clicks = clicks;
    this.description = description;
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

  canMoveTo(next: SlaAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.minimum * this.impressions * 100) / 100;
  }

  copy(): SlaAgreement {
    return new SlaAgreement(
      this.code,
      this.label,
      this.impressions,
      this.phone,
      this.minimum,
      this.retries,
      this.amount,
      this.title,
      this.margin,
      this.clicks,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sla agreement in status open. */
export function newSlaAgreement(code: string, label: string): SlaAgreement {
  return new SlaAgreement(code, label, 0, "", 0, 0, 0, "", 0, 0, "", "open");
}
