import * as text from "../../../../kit/text.js";

/** Where a tiered exit rule agreement is in its life cycle. */
export type TieredExitRuleAgreementStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered exit rule agreement and its current status. */
export class TieredExitRuleAgreement {
  code: string;
  name: string;
  locale: string;
  threshold: number;
  country: string;
  revision: number;
  cohort: string;
  createdAt: number;
  status: TieredExitRuleAgreementStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    threshold: number,
    country: string,
    revision: number,
    cohort: string,
    createdAt: number,
    status: TieredExitRuleAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.threshold = threshold;
    this.country = country;
    this.revision = revision;
    this.cohort = cohort;
    this.createdAt = createdAt;
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

  canMoveTo(next: TieredExitRuleAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredExitRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered exit rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round(this.threshold * this.revision * 100) / 100;
  }

  copy(): TieredExitRuleAgreement {
    return new TieredExitRuleAgreement(
      this.code,
      this.name,
      this.locale,
      this.threshold,
      this.country,
      this.revision,
      this.cohort,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered exit rule agreement in status created. */
export function newTieredExitRuleAgreement(code: string, name: string): TieredExitRuleAgreement {
  return new TieredExitRuleAgreement(code, name, "", 0, "", 0, "", 0, "created");
}
