import * as text from "../../../../kit/text.js";

/** Where a exit rule template is in its life cycle. */
export type ExitRuleTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a exit rule template and its current status. */
export class ExitRuleTemplate {
  code: string;
  name: string;
  journeyId: string;
  reviewer: string;
  attributes: Map<string, string>;
  category: string;
  amount: number;
  status: ExitRuleTemplateStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    reviewer: string,
    attributes: Map<string, string>,
    category: string,
    amount: number,
    status: ExitRuleTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.attributes = attributes;
    this.category = category;
    this.amount = amount;
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

  canMoveTo(next: ExitRuleTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ExitRuleTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ExitRuleTemplate {
    return new ExitRuleTemplate(
      this.code,
      this.name,
      this.journeyId,
      this.reviewer,
      this.attributes,
      this.category,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a exit rule template in status idle. */
export function newExitRuleTemplate(code: string, name: string): ExitRuleTemplate {
  return new ExitRuleTemplate(code, name, "", "", new Map<string, string>(), "", 0, "idle");
}
