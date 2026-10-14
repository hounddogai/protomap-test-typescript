import * as text from "../../../../kit/text.js";

/** Where a capped enrollment draft is in its life cycle. */
export type CappedEnrollmentDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped enrollment draft as the enrollment team keeps it. */
export class CappedEnrollmentDraft {
  code: string;
  label: string;
  country: string;
  openRate: number;
  weight: number;
  status: CappedEnrollmentDraftStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    openRate: number,
    weight: number,
    status: CappedEnrollmentDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.openRate = openRate;
    this.weight = weight;
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

  canMoveTo(next: CappedEnrollmentDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedEnrollmentDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped enrollment draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.openRate + this.weight) * 100) / 100;
  }

  copy(): CappedEnrollmentDraft {
    return new CappedEnrollmentDraft(this.code, this.label, this.country, this.openRate, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a capped enrollment draft in status idle. */
export function newCappedEnrollmentDraft(code: string, label: string): CappedEnrollmentDraft {
  return new CappedEnrollmentDraft(code, label, "", 0, 0, "idle");
}
