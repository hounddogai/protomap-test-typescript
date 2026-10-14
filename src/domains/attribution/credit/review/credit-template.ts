import * as text from "../../../../kit/text.js";

/** Where a credit template is in its life cycle. */
export type CreditTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a credit template and its current status. */
export class CreditTemplate {
  code: string;
  name: string;
  externalRef: string;
  margin: number;
  country: string;
  category: string;
  threshold: number;
  channel: string;
  summary: string;
  checksum: string;
  openRate: number;
  status: CreditTemplateStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    margin: number,
    country: string,
    category: string,
    threshold: number,
    channel: string,
    summary: string,
    checksum: string,
    openRate: number,
    status: CreditTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.margin = margin;
    this.country = country;
    this.category = category;
    this.threshold = threshold;
    this.channel = channel;
    this.summary = summary;
    this.checksum = checksum;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"credit template"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.openRate * this.margin * 100) / 100;
  }

  copy(): CreditTemplate {
    return new CreditTemplate(
      this.code,
      this.name,
      this.externalRef,
      this.margin,
      this.country,
      this.category,
      this.threshold,
      this.channel,
      this.summary,
      this.checksum,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a credit template in status planned. */
export function newCreditTemplate(code: string, name: string): CreditTemplate {
  return new CreditTemplate(code, name, "", 0, "", "", 0, "", "", "", 0, "planned");
}
