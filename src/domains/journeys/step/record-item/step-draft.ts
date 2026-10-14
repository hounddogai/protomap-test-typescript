import * as text from "../../../../kit/text.js";

/** Where a step draft is in its life cycle. */
export type StepDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a step draft and its current status. */
export class StepDraft {
  code: string;
  label: string;
  updatedAt: number;
  windowDays: number;
  campaignRef: string;
  discount: number;
  variant: string;
  minimum: number;
  startsAt: number;
  durationMinutes: number;
  frequencyCap: number;
  status: StepDraftStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    windowDays: number,
    campaignRef: string,
    discount: number,
    variant: string,
    minimum: number,
    startsAt: number,
    durationMinutes: number,
    frequencyCap: number,
    status: StepDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.discount = discount;
    this.variant = variant;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: StepDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StepDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.startsAt + this.discount) * 100) / 100;
  }

  copy(): StepDraft {
    return new StepDraft(
      this.code,
      this.label,
      this.updatedAt,
      this.windowDays,
      this.campaignRef,
      this.discount,
      this.variant,
      this.minimum,
      this.startsAt,
      this.durationMinutes,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a step draft in status open. */
export function newStepDraft(code: string, label: string): StepDraft {
  return new StepDraft(code, label, 0, 0, "", 0, "", 0, 0, 0, 0, "open");
}
