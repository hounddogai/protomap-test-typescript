import * as text from "../../../../kit/text.js";

/** Where a regional step override is in its life cycle. */
export type RegionalStepOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional step override, with what the planners need to act on it. */
export class RegionalStepOverride {
  code: string;
  label: string;
  active: boolean;
  retries: number;
  margin: number;
  phone: string;
  visible: boolean;
  discount: number;
  contactEmail: string;
  budget: number;
  status: RegionalStepOverrideStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    retries: number,
    margin: number,
    phone: string,
    visible: boolean,
    discount: number,
    contactEmail: string,
    budget: number,
    status: RegionalStepOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.retries = retries;
    this.margin = margin;
    this.phone = phone;
    this.visible = visible;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalStepOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalStepOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional step override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round((this.retries - this.discount) * 100) / 100;
  }

  copy(): RegionalStepOverride {
    return new RegionalStepOverride(
      this.code,
      this.label,
      this.active,
      this.retries,
      this.margin,
      this.phone,
      this.visible,
      this.discount,
      this.contactEmail,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional step override in status idle. */
export function newRegionalStepOverride(code: string, label: string): RegionalStepOverride {
  return new RegionalStepOverride(code, label, false, 0, 0, "", false, 0, "", 0, "idle");
}
