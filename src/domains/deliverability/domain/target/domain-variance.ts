import * as text from "../../../../kit/text.js";

/** Where a domain variance is in its life cycle. */
export type DomainVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A domain variance. Its code is unique within a tenant. */
export class DomainVariance {
  code: string;
  title: string;
  locale: string;
  summary: string;
  notes: string;
  checksum: string;
  quantity: number;
  status: DomainVarianceStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    summary: string,
    notes: string,
    checksum: string,
    quantity: number,
    status: DomainVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.summary = summary;
    this.notes = notes;
    this.checksum = checksum;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DomainVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): DomainVariance {
    return new DomainVariance(
      this.code,
      this.title,
      this.locale,
      this.summary,
      this.notes,
      this.checksum,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a domain variance in status requested. */
export function newDomainVariance(code: string, title: string): DomainVariance {
  return new DomainVariance(code, title, "", "", "", "", 0, "requested");
}
