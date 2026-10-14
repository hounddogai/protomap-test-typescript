import * as text from "../../../../kit/text.js";

/** Where a rolling paywall agreement is in its life cycle. */
export type RollingPaywallAgreementStatus = "created" | "validated" | "published" | "retired";

/** One rolling paywall agreement, with what the planners need to act on it. */
export class RollingPaywallAgreement {
  code: string;
  label: string;
  visible: boolean;
  capacity: number;
  attributes: Map<string, string>;
  ratio: number;
  variant: string;
  status: RollingPaywallAgreementStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    capacity: number,
    attributes: Map<string, string>,
    ratio: number,
    variant: string,
    status: RollingPaywallAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.capacity = capacity;
    this.attributes = attributes;
    this.ratio = ratio;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingPaywallAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingPaywallAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling paywall agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  projectedTotal(): number {
    return Math.round((this.ratio - this.capacity) * 100) / 100;
  }

  copy(): RollingPaywallAgreement {
    return new RollingPaywallAgreement(
      this.code,
      this.label,
      this.visible,
      this.capacity,
      this.attributes,
      this.ratio,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling paywall agreement in status created. */
export function newRollingPaywallAgreement(code: string, label: string): RollingPaywallAgreement {
  return new RollingPaywallAgreement(code, label, false, 0, new Map<string, string>(), 0, "", "created");
}
