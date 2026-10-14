import * as text from "../../../../kit/text.js";

/** Where a complaint estimate is in its life cycle. */
export type ComplaintEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** A complaint estimate. Its code is unique within a tenant. */
export class ComplaintEstimate {
  code: string;
  name: string;
  locale: string;
  category: string;
  version: number;
  minimum: number;
  status: ComplaintEstimateStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    category: string,
    version: number,
    minimum: number,
    status: ComplaintEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.category = category;
    this.version = version;
    this.minimum = minimum;
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

  canMoveTo(next: ComplaintEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ComplaintEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.minimum - this.version) * 100) / 100;
  }

  copy(): ComplaintEstimate {
    return new ComplaintEstimate(
      this.code,
      this.name,
      this.locale,
      this.category,
      this.version,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a complaint estimate in status requested. */
export function newComplaintEstimate(code: string, name: string): ComplaintEstimate {
  return new ComplaintEstimate(code, name, "", "", 0, 0, "requested");
}
