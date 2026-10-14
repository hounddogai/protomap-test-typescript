import * as text from "../../../../kit/text.js";

/** Where a tier policy is in its life cycle. */
export type TierPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tier policy. Its code is unique within a tenant. */
export class TierPolicy {
  code: string;
  label: string;
  margin: number;
  archived: boolean;
  limit: number;
  attributes: Map<string, string>;
  graceDays: number;
  status: TierPolicyStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    archived: boolean,
    limit: number,
    attributes: Map<string, string>,
    graceDays: number,
    status: TierPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.archived = archived;
    this.limit = limit;
    this.attributes = attributes;
    this.graceDays = graceDays;
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

  canMoveTo(next: TierPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round((this.margin - this.graceDays) * 100) / 100;
  }

  copy(): TierPolicy {
    return new TierPolicy(
      this.code,
      this.label,
      this.margin,
      this.archived,
      this.limit,
      this.attributes,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tier policy in status open. */
export function newTierPolicy(code: string, label: string): TierPolicy {
  return new TierPolicy(code, label, 0, false, 0, new Map<string, string>(), 0, "open");
}
