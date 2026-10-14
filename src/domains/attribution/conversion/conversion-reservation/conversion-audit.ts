import * as text from "../../../../kit/text.js";

/** Where a conversion audit is in its life cycle. */
export type ConversionAuditStatus = "created" | "validated" | "published" | "retired";

/** A conversion audit as the conversion team keeps it. */
export class ConversionAudit {
  code: string;
  name: string;
  title: string;
  description: string;
  contactEmail: string;
  retries: number;
  maximum: number;
  rate: number;
  discount: number;
  status: ConversionAuditStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    description: string,
    contactEmail: string,
    retries: number,
    maximum: number,
    rate: number,
    discount: number,
    status: ConversionAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.description = description;
    this.contactEmail = contactEmail;
    this.retries = retries;
    this.maximum = maximum;
    this.rate = rate;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionAuditStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ConversionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"conversion audit"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.retries - this.discount) * 100) / 100;
  }

  copy(): ConversionAudit {
    return new ConversionAudit(
      this.code,
      this.name,
      this.title,
      this.description,
      this.contactEmail,
      this.retries,
      this.maximum,
      this.rate,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a conversion audit in status created. */
export function newConversionAudit(code: string, name: string): ConversionAudit {
  return new ConversionAudit(code, name, "", "", "", 0, 0, 0, 0, "created");
}
