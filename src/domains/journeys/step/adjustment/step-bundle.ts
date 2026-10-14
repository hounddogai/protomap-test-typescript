import * as text from "../../../../kit/text.js";

/** Where a step bundle is in its life cycle. */
export type StepBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A step bundle. Its code is unique within a tenant. */
export class StepBundle {
  code: string;
  title: string;
  phone: string;
  frequencyCap: number;
  openRate: number;
  variant: string;
  description: string;
  budget: number;
  graceDays: number;
  attempts: number;
  status: StepBundleStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    frequencyCap: number,
    openRate: number,
    variant: string,
    description: string,
    budget: number,
    graceDays: number,
    attempts: number,
    status: StepBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.variant = variant;
    this.description = description;
    this.budget = budget;
    this.graceDays = graceDays;
    this.attempts = attempts;
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

  canMoveTo(next: StepBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round(this.openRate * this.frequencyCap * 100) / 100;
  }

  copy(): StepBundle {
    return new StepBundle(
      this.code,
      this.title,
      this.phone,
      this.frequencyCap,
      this.openRate,
      this.variant,
      this.description,
      this.budget,
      this.graceDays,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a step bundle in status draft. */
export function newStepBundle(code: string, title: string): StepBundle {
  return new StepBundle(code, title, "", 0, 0, "", "", 0, 0, 0, "draft");
}
