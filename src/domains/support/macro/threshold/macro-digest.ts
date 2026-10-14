import * as text from "../../../../kit/text.js";

/** Where a macro digest is in its life cycle. */
export type MacroDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a macro digest and its current status. */
export class MacroDigest {
  code: string;
  title: string;
  windowDays: number;
  attributes: Map<string, string>;
  score: number;
  amount: number;
  weight: number;
  campaignRef: string;
  active: boolean;
  description: string;
  status: MacroDigestStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    attributes: Map<string, string>,
    score: number,
    amount: number,
    weight: number,
    campaignRef: string,
    active: boolean,
    description: string,
    status: MacroDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.attributes = attributes;
    this.score = score;
    this.amount = amount;
    this.weight = weight;
    this.campaignRef = campaignRef;
    this.active = active;
    this.description = description;
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

  canMoveTo(next: MacroDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: MacroDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro digest ${this.code} cannot move from ${this.status} to ${next}`);
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

  projectedTotal(): number {
    return Math.round((this.score + this.windowDays) * 100) / 100;
  }

  copy(): MacroDigest {
    return new MacroDigest(
      this.code,
      this.title,
      this.windowDays,
      this.attributes,
      this.score,
      this.amount,
      this.weight,
      this.campaignRef,
      this.active,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a macro digest in status planned. */
export function newMacroDigest(code: string, title: string): MacroDigest {
  return new MacroDigest(code, title, 0, new Map<string, string>(), 0, 0, 0, "", false, "", "planned");
}
