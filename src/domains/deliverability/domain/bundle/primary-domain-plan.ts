import * as text from "../../../../kit/text.js";

/** Where a primary domain plan is in its life cycle. */
export type PrimaryDomainPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary domain plan. Its code is unique within a tenant. */
export class PrimaryDomainPlan {
  code: string;
  name: string;
  frequencyCap: number;
  reviewer: string;
  checksum: string;
  contactEmail: string;
  description: string;
  variant: string;
  summary: string;
  status: PrimaryDomainPlanStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    reviewer: string,
    checksum: string,
    contactEmail: string,
    description: string,
    variant: string,
    summary: string,
    status: PrimaryDomainPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.contactEmail = contactEmail;
    this.description = description;
    this.variant = variant;
    this.summary = summary;
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

  canMoveTo(next: PrimaryDomainPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryDomainPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary domain plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): PrimaryDomainPlan {
    return new PrimaryDomainPlan(
      this.code,
      this.name,
      this.frequencyCap,
      this.reviewer,
      this.checksum,
      this.contactEmail,
      this.description,
      this.variant,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary domain plan in status proposed. */
export function newPrimaryDomainPlan(code: string, name: string): PrimaryDomainPlan {
  return new PrimaryDomainPlan(code, name, 0, "", "", "", "", "", "", "proposed");
}
