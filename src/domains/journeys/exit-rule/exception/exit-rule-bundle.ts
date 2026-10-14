import * as text from "../../../../kit/text.js";

/** Where a exit rule bundle is in its life cycle. */
export type ExitRuleBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** One exit rule bundle, with what the planners need to act on it. */
export class ExitRuleBundle {
  code: string;
  name: string;
  priority: number;
  amount: number;
  approved: boolean;
  floorValue: number;
  channel: string;
  variant: string;
  checksum: string;
  label: string;
  weight: number;
  status: ExitRuleBundleStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    amount: number,
    approved: boolean,
    floorValue: number,
    channel: string,
    variant: string,
    checksum: string,
    label: string,
    weight: number,
    status: ExitRuleBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.amount = amount;
    this.approved = approved;
    this.floorValue = floorValue;
    this.channel = channel;
    this.variant = variant;
    this.checksum = checksum;
    this.label = label;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ExitRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"exit rule bundle"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.floorValue - this.priority) * 100) / 100;
  }

  copy(): ExitRuleBundle {
    return new ExitRuleBundle(
      this.code,
      this.name,
      this.priority,
      this.amount,
      this.approved,
      this.floorValue,
      this.channel,
      this.variant,
      this.checksum,
      this.label,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a exit rule bundle in status requested. */
export function newExitRuleBundle(code: string, name: string): ExitRuleBundle {
  return new ExitRuleBundle(code, name, 0, 0, false, 0, "", "", "", "", 0, "requested");
}
