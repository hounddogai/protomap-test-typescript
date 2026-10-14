import * as text from "../../../../kit/text.js";

/** Where a lenient fraud check rollup is in its life cycle. */
export type LenientFraudCheckRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient fraud check rollup. Its code is unique within a tenant. */
export class LenientFraudCheckRollup {
  code: string;
  label: string;
  updatedAt: number;
  attributes: Map<string, string>;
  ownerId: string;
  status: LenientFraudCheckRollupStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    attributes: Map<string, string>,
    ownerId: string,
    status: LenientFraudCheckRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.ownerId = ownerId;
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

  canMoveTo(next: LenientFraudCheckRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
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
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientFraudCheckRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient fraud check rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): LenientFraudCheckRollup {
    return new LenientFraudCheckRollup(
      this.code,
      this.label,
      this.updatedAt,
      this.attributes,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient fraud check rollup in status planned. */
export function newLenientFraudCheckRollup(code: string, label: string): LenientFraudCheckRollup {
  return new LenientFraudCheckRollup(code, label, 0, new Map<string, string>(), "", "planned");
}
