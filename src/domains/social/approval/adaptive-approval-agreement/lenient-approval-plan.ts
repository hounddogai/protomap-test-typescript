import * as text from "../../../../kit/text.js";

/** Where a lenient approval plan is in its life cycle. */
export type LenientApprovalPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient approval plan as the approval team keeps it. */
export class LenientApprovalPlan {
  code: string;
  name: string;
  attributes: Map<string, string>;
  threshold: number;
  version: number;
  sendAt: number;
  segment: string;
  ratio: number;
  createdAt: number;
  budget: number;
  status: LenientApprovalPlanStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    threshold: number,
    version: number,
    sendAt: number,
    segment: string,
    ratio: number,
    createdAt: number,
    budget: number,
    status: LenientApprovalPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.threshold = threshold;
    this.version = version;
    this.sendAt = sendAt;
    this.segment = segment;
    this.ratio = ratio;
    this.createdAt = createdAt;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientApprovalPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientApprovalPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient approval plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round(this.threshold * this.budget * 100) / 100;
  }

  copy(): LenientApprovalPlan {
    return new LenientApprovalPlan(
      this.code,
      this.name,
      this.attributes,
      this.threshold,
      this.version,
      this.sendAt,
      this.segment,
      this.ratio,
      this.createdAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient approval plan in status planned. */
export function newLenientApprovalPlan(code: string, name: string): LenientApprovalPlan {
  return new LenientApprovalPlan(code, name, new Map<string, string>(), 0, 0, 0, "", 0, 0, 0, "planned");
}
