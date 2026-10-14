import * as text from "../../../../kit/text.js";

/** Where a regional queue rule is in its life cycle. */
export type RegionalQueueRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional queue rule as the queue team keeps it. */
export class RegionalQueueRule {
  code: string;
  name: string;
  label: string;
  utmSource: string;
  category: string;
  createdAt: number;
  reviewer: string;
  status: RegionalQueueRuleStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    utmSource: string,
    category: string,
    createdAt: number,
    reviewer: string,
    status: RegionalQueueRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.utmSource = utmSource;
    this.category = category;
    this.createdAt = createdAt;
    this.reviewer = reviewer;
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

  canMoveTo(next: RegionalQueueRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalQueueRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional queue rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): RegionalQueueRule {
    return new RegionalQueueRule(
      this.code,
      this.name,
      this.label,
      this.utmSource,
      this.category,
      this.createdAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a regional queue rule in status requested. */
export function newRegionalQueueRule(code: string, name: string): RegionalQueueRule {
  return new RegionalQueueRule(code, name, "", "", "", 0, "", "requested");
}
