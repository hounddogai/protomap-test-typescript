import * as text from "../../../../kit/text.js";

/** Where a activation rule is in its life cycle. */
export type ActivationRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A activation rule as the activation team keeps it. */
export class ActivationRule {
  code: string;
  title: string;
  sequence: number;
  ratio: number;
  amount: number;
  summary: string;
  attributes: Map<string, string>;
  status: ActivationRuleStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    ratio: number,
    amount: number,
    summary: string,
    attributes: Map<string, string>,
    status: ActivationRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.ratio = ratio;
    this.amount = amount;
    this.summary = summary;
    this.attributes = attributes;
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

  canMoveTo(next: ActivationRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ActivationRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.amount + this.ratio) * 100) / 100;
  }

  copy(): ActivationRule {
    return new ActivationRule(
      this.code,
      this.title,
      this.sequence,
      this.ratio,
      this.amount,
      this.summary,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a activation rule in status planned. */
export function newActivationRule(code: string, title: string): ActivationRule {
  return new ActivationRule(code, title, 0, 0, 0, "", new Map<string, string>(), "planned");
}
