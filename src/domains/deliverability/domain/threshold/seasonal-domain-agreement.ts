import * as text from "../../../../kit/text.js";

/** Where a seasonal domain agreement is in its life cycle. */
export type SeasonalDomainAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal domain agreement as the domain team keeps it. */
export class SeasonalDomainAgreement {
  code: string;
  title: string;
  durationMinutes: number;
  quantity: number;
  notes: string;
  status: SeasonalDomainAgreementStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    quantity: number,
    notes: string,
    status: SeasonalDomainAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.quantity = quantity;
    this.notes = notes;
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

  canMoveTo(next: SeasonalDomainAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalDomainAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal domain agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.quantity - this.durationMinutes) * 100) / 100;
  }

  copy(): SeasonalDomainAgreement {
    return new SeasonalDomainAgreement(
      this.code,
      this.title,
      this.durationMinutes,
      this.quantity,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal domain agreement in status draft. */
export function newSeasonalDomainAgreement(code: string, title: string): SeasonalDomainAgreement {
  return new SeasonalDomainAgreement(code, title, 0, 0, "", "draft");
}
