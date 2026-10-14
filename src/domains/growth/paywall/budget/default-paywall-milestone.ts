import * as text from "../../../../kit/text.js";

/** Where a default paywall milestone is in its life cycle. */
export type DefaultPaywallMilestoneStatus = "created" | "validated" | "published" | "retired";

/** A default paywall milestone as the paywall team keeps it. */
export class DefaultPaywallMilestone {
  code: string;
  name: string;
  quantity: number;
  attributes: Map<string, string>;
  clicks: number;
  label: string;
  reviewer: string;
  checksum: string;
  status: DefaultPaywallMilestoneStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    attributes: Map<string, string>,
    clicks: number,
    label: string,
    reviewer: string,
    checksum: string,
    status: DefaultPaywallMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.attributes = attributes;
    this.clicks = clicks;
    this.label = label;
    this.reviewer = reviewer;
    this.checksum = checksum;
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

  canMoveTo(next: DefaultPaywallMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultPaywallMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default paywall milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.clicks - this.quantity) * 100) / 100;
  }

  copy(): DefaultPaywallMilestone {
    return new DefaultPaywallMilestone(
      this.code,
      this.name,
      this.quantity,
      this.attributes,
      this.clicks,
      this.label,
      this.reviewer,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default paywall milestone in status created. */
export function newDefaultPaywallMilestone(code: string, name: string): DefaultPaywallMilestone {
  return new DefaultPaywallMilestone(code, name, 0, new Map<string, string>(), 0, "", "", "", "created");
}
