import * as text from "../../../../kit/text.js";

/** Where a domain score is in its life cycle. */
export type DomainScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A domain score. Its code is unique within a tenant. */
export class DomainScore {
  code: string;
  label: string;
  unit: string;
  version: number;
  phone: string;
  score: number;
  country: string;
  approved: boolean;
  status: DomainScoreStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    version: number,
    phone: string,
    score: number,
    country: string,
    approved: boolean,
    status: DomainScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.version = version;
    this.phone = phone;
    this.score = score;
    this.country = country;
    this.approved = approved;
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

  canMoveTo(next: DomainScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"domain score"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.version - this.score) * 100) / 100;
  }

  copy(): DomainScore {
    return new DomainScore(
      this.code,
      this.label,
      this.unit,
      this.version,
      this.phone,
      this.score,
      this.country,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a domain score in status proposed. */
export function newDomainScore(code: string, label: string): DomainScore {
  return new DomainScore(code, label, "", 0, "", 0, "", false, "proposed");
}
