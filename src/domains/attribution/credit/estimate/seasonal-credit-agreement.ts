import * as text from "../../../../kit/text.js";

/** Where a seasonal credit agreement is in its life cycle. */
export type SeasonalCreditAgreementStatus = "created" | "validated" | "published" | "retired";

/** A seasonal credit agreement as the credit team keeps it. */
export class SeasonalCreditAgreement {
  code: string;
  name: string;
  ownerId: string;
  utmSource: string;
  budget: number;
  floorValue: number;
  bid: number;
  archived: boolean;
  externalRef: string;
  revision: number;
  status: SeasonalCreditAgreementStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    utmSource: string,
    budget: number,
    floorValue: number,
    bid: number,
    archived: boolean,
    externalRef: string,
    revision: number,
    status: SeasonalCreditAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.budget = budget;
    this.floorValue = floorValue;
    this.bid = bid;
    this.archived = archived;
    this.externalRef = externalRef;
    this.revision = revision;
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

  canMoveTo(next: SeasonalCreditAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
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

  moveTo(next: SeasonalCreditAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal credit agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"seasonal credit agreement"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.budget * this.bid * 100) / 100;
  }

  copy(): SeasonalCreditAgreement {
    return new SeasonalCreditAgreement(
      this.code,
      this.name,
      this.ownerId,
      this.utmSource,
      this.budget,
      this.floorValue,
      this.bid,
      this.archived,
      this.externalRef,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal credit agreement in status created. */
export function newSeasonalCreditAgreement(code: string, name: string): SeasonalCreditAgreement {
  return new SeasonalCreditAgreement(code, name, "", "", 0, 0, 0, false, "", 0, "created");
}
