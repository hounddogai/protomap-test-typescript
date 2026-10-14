import * as text from "../../../../kit/text.js";

/** Where a lenient suppression plan is in its life cycle. */
export type LenientSuppressionPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** One lenient suppression plan, with what the planners need to act on it. */
export class LenientSuppressionPlan {
  code: string;
  label: string;
  graceDays: number;
  discount: number;
  retries: number;
  revision: number;
  source: string;
  name: string;
  weight: number;
  status: LenientSuppressionPlanStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    discount: number,
    retries: number,
    revision: number,
    source: string,
    name: string,
    weight: number,
    status: LenientSuppressionPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.discount = discount;
    this.retries = retries;
    this.revision = revision;
    this.source = source;
    this.name = name;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientSuppressionPlanStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientSuppressionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient suppression plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays + this.retries) * 100) / 100;
  }

  copy(): LenientSuppressionPlan {
    return new LenientSuppressionPlan(
      this.code,
      this.label,
      this.graceDays,
      this.discount,
      this.retries,
      this.revision,
      this.source,
      this.name,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient suppression plan in status new. */
export function newLenientSuppressionPlan(code: string, label: string): LenientSuppressionPlan {
  return new LenientSuppressionPlan(code, label, 0, 0, 0, 0, "", "", 0, "new");
}
