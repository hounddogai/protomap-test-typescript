import * as text from "../../../../kit/text.js";

/** Where a scheduled macro agreement is in its life cycle. */
export type ScheduledMacroAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled macro agreement as the macro team keeps it. */
export class ScheduledMacroAgreement {
  code: string;
  label: string;
  weight: number;
  currency: string;
  score: number;
  tags: string[];
  status: ScheduledMacroAgreementStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    currency: string,
    score: number,
    tags: string[],
    status: ScheduledMacroAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.currency = currency;
    this.score = score;
    this.tags = tags;
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

  canMoveTo(next: ScheduledMacroAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledMacroAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled macro agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.score - this.weight) * 100) / 100;
  }

  copy(): ScheduledMacroAgreement {
    return new ScheduledMacroAgreement(
      this.code,
      this.label,
      this.weight,
      this.currency,
      this.score,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled macro agreement in status open. */
export function newScheduledMacroAgreement(code: string, label: string): ScheduledMacroAgreement {
  return new ScheduledMacroAgreement(code, label, 0, "", 0, [], "open");
}
