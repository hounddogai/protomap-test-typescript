import * as text from "../../../../kit/text.js";

/** Where a step agreement is in its life cycle. */
export type StepAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A step agreement as the step team keeps it. */
export class StepAgreement {
  code: string;
  title: string;
  version: number;
  ratio: number;
  discount: number;
  notes: string;
  score: number;
  priority: number;
  maximum: number;
  attributes: Map<string, string>;
  status: StepAgreementStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    ratio: number,
    discount: number,
    notes: string,
    score: number,
    priority: number,
    maximum: number,
    attributes: Map<string, string>,
    status: StepAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.ratio = ratio;
    this.discount = discount;
    this.notes = notes;
    this.score = score;
    this.priority = priority;
    this.maximum = maximum;
    this.attributes = attributes;
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

  canMoveTo(next: StepAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StepAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round(this.version * this.score * 100) / 100;
  }

  copy(): StepAgreement {
    return new StepAgreement(
      this.code,
      this.title,
      this.version,
      this.ratio,
      this.discount,
      this.notes,
      this.score,
      this.priority,
      this.maximum,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a step agreement in status open. */
export function newStepAgreement(code: string, title: string): StepAgreement {
  return new StepAgreement(code, title, 0, 0, 0, "", 0, 0, 0, new Map<string, string>(), "open");
}
