import * as text from "../../../../kit/text.js";

/** Where a funnel plan is in its life cycle. */
export type FunnelPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A funnel plan as the funnel team keeps it. */
export class FunnelPlan {
  code: string;
  name: string;
  retries: number;
  phone: string;
  openRate: number;
  label: string;
  contactEmail: string;
  status: FunnelPlanStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    phone: string,
    openRate: number,
    label: string,
    contactEmail: string,
    status: FunnelPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.phone = phone;
    this.openRate = openRate;
    this.label = label;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: FunnelPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
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

  moveTo(next: FunnelPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round(this.openRate * this.retries * 100) / 100;
  }

  copy(): FunnelPlan {
    return new FunnelPlan(
      this.code,
      this.name,
      this.retries,
      this.phone,
      this.openRate,
      this.label,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel plan in status draft. */
export function newFunnelPlan(code: string, name: string): FunnelPlan {
  return new FunnelPlan(code, name, 0, "", 0, "", "", "draft");
}
