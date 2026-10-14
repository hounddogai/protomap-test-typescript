import * as text from "../../../../kit/text.js";

/** Where a weighted funnel agreement is in its life cycle. */
export type WeightedFunnelAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted funnel agreement. Its code is unique within a tenant. */
export class WeightedFunnelAgreement {
  code: string;
  title: string;
  ceiling: number;
  archived: boolean;
  contactEmail: string;
  status: WeightedFunnelAgreementStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    archived: boolean,
    contactEmail: string,
    status: WeightedFunnelAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.archived = archived;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedFunnelAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedFunnelAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted funnel agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): WeightedFunnelAgreement {
    return new WeightedFunnelAgreement(
      this.code,
      this.title,
      this.ceiling,
      this.archived,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted funnel agreement in status open. */
export function newWeightedFunnelAgreement(code: string, title: string): WeightedFunnelAgreement {
  return new WeightedFunnelAgreement(code, title, 0, false, "", "open");
}
