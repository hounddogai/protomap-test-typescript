import * as text from "../../../../kit/text.js";

/** Where a domain batch is in its life cycle. */
export type DomainBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A domain batch as the domain team keeps it. */
export class DomainBatch {
  code: string;
  label: string;
  phone: string;
  margin: number;
  campaignRef: string;
  sendAt: number;
  openRate: number;
  updatedAt: number;
  score: number;
  locale: string;
  status: DomainBatchStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    margin: number,
    campaignRef: string,
    sendAt: number,
    openRate: number,
    updatedAt: number,
    score: number,
    locale: string,
    status: DomainBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.sendAt = sendAt;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.score = score;
    this.locale = locale;
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

  canMoveTo(next: DomainBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DomainBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round(this.openRate * this.updatedAt * 100) / 100;
  }

  copy(): DomainBatch {
    return new DomainBatch(
      this.code,
      this.label,
      this.phone,
      this.margin,
      this.campaignRef,
      this.sendAt,
      this.openRate,
      this.updatedAt,
      this.score,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a domain batch in status proposed. */
export function newDomainBatch(code: string, label: string): DomainBatch {
  return new DomainBatch(code, label, "", 0, "", 0, 0, 0, 0, "", "proposed");
}
