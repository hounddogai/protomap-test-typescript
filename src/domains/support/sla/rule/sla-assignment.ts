import * as text from "../../../../kit/text.js";

/** Where a sla assignment is in its life cycle. */
export type SlaAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a sla assignment and its current status. */
export class SlaAssignment {
  code: string;
  name: string;
  currency: string;
  variant: string;
  threshold: number;
  segment: string;
  attributes: Map<string, string>;
  locale: string;
  status: SlaAssignmentStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    variant: string,
    threshold: number,
    segment: string,
    attributes: Map<string, string>,
    locale: string,
    status: SlaAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.variant = variant;
    this.threshold = threshold;
    this.segment = segment;
    this.attributes = attributes;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla assignment ${this.code} cannot move from ${this.status} to ${next}`);
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
    return this.threshold;
  }

  copy(): SlaAssignment {
    return new SlaAssignment(
      this.code,
      this.name,
      this.currency,
      this.variant,
      this.threshold,
      this.segment,
      this.attributes,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sla assignment in status draft. */
export function newSlaAssignment(code: string, name: string): SlaAssignment {
  return new SlaAssignment(code, name, "", "", 0, "", new Map<string, string>(), "", "draft");
}
