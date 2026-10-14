import * as text from "../../../../kit/text.js";

/** Where a csat threshold is in its life cycle. */
export type CsatThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One csat threshold, with what the planners need to act on it. */
export class CsatThreshold {
  code: string;
  name: string;
  phone: string;
  weight: number;
  amount: number;
  rate: number;
  contactEmail: string;
  category: string;
  ratio: number;
  utmSource: string;
  status: CsatThresholdStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    weight: number,
    amount: number,
    rate: number,
    contactEmail: string,
    category: string,
    ratio: number,
    utmSource: string,
    status: CsatThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.weight = weight;
    this.amount = amount;
    this.rate = rate;
    this.contactEmail = contactEmail;
    this.category = category;
    this.ratio = ratio;
    this.utmSource = utmSource;
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

  canMoveTo(next: CsatThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"csat threshold"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.amount * this.ratio * 100) / 100;
  }

  copy(): CsatThreshold {
    return new CsatThreshold(
      this.code,
      this.name,
      this.phone,
      this.weight,
      this.amount,
      this.rate,
      this.contactEmail,
      this.category,
      this.ratio,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a csat threshold in status draft. */
export function newCsatThreshold(code: string, name: string): CsatThreshold {
  return new CsatThreshold(code, name, "", 0, 0, 0, "", "", 0, "", "draft");
}
