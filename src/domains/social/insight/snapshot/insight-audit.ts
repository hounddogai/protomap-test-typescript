import * as text from "../../../../kit/text.js";

/** Where a insight audit is in its life cycle. */
export type InsightAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One insight audit, with what the planners need to act on it. */
export class InsightAudit {
  code: string;
  name: string;
  country: string;
  attributes: Map<string, string>;
  utmSource: string;
  description: string;
  amount: number;
  status: InsightAuditStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    attributes: Map<string, string>,
    utmSource: string,
    description: string,
    amount: number,
    status: InsightAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.attributes = attributes;
    this.utmSource = utmSource;
    this.description = description;
    this.amount = amount;
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

  canMoveTo(next: InsightAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: InsightAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  measuredValue(): number {
    return this.amount;
  }

  copy(): InsightAudit {
    return new InsightAudit(
      this.code,
      this.name,
      this.country,
      this.attributes,
      this.utmSource,
      this.description,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a insight audit in status planned. */
export function newInsightAudit(code: string, name: string): InsightAudit {
  return new InsightAudit(code, name, "", new Map<string, string>(), "", "", 0, "planned");
}
