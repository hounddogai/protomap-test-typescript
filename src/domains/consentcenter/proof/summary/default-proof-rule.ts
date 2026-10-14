import * as text from "../../../../kit/text.js";

/** Where a default proof rule is in its life cycle. */
export type DefaultProofRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a default proof rule and its current status. */
export class DefaultProofRule {
  code: string;
  title: string;
  frequencyCap: number;
  summary: string;
  segment: string;
  phone: string;
  variant: string;
  bid: number;
  endsAt: number;
  status: DefaultProofRuleStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    summary: string,
    segment: string,
    phone: string,
    variant: string,
    bid: number,
    endsAt: number,
    status: DefaultProofRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.summary = summary;
    this.segment = segment;
    this.phone = phone;
    this.variant = variant;
    this.bid = bid;
    this.endsAt = endsAt;
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

  canMoveTo(next: DefaultProofRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultProofRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default proof rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round(this.endsAt * this.frequencyCap * 100) / 100;
  }

  copy(): DefaultProofRule {
    return new DefaultProofRule(
      this.code,
      this.title,
      this.frequencyCap,
      this.summary,
      this.segment,
      this.phone,
      this.variant,
      this.bid,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default proof rule in status planned. */
export function newDefaultProofRule(code: string, title: string): DefaultProofRule {
  return new DefaultProofRule(code, title, 0, "", "", "", "", 0, 0, "planned");
}
