import * as text from "../../../../kit/text.js";

/** Where a primary fraud check claim is in its life cycle. */
export type PrimaryFraudCheckClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One primary fraud check claim, with what the planners need to act on it. */
export class PrimaryFraudCheckClaim {
  code: string;
  label: string;
  capacity: number;
  conversionRate: number;
  priority: number;
  contactEmail: string;
  revision: number;
  name: string;
  version: number;
  description: string;
  status: PrimaryFraudCheckClaimStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    conversionRate: number,
    priority: number,
    contactEmail: string,
    revision: number,
    name: string,
    version: number,
    description: string,
    status: PrimaryFraudCheckClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.priority = priority;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.name = name;
    this.version = version;
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

  canMoveTo(next: PrimaryFraudCheckClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "cancelled";
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

  moveTo(next: PrimaryFraudCheckClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary fraud check claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"primary fraud check claim"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.revision - this.conversionRate) * 100) / 100;
  }

  copy(): PrimaryFraudCheckClaim {
    return new PrimaryFraudCheckClaim(
      this.code,
      this.label,
      this.capacity,
      this.conversionRate,
      this.priority,
      this.contactEmail,
      this.revision,
      this.name,
      this.version,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary fraud check claim in status planned. */
export function newPrimaryFraudCheckClaim(code: string, label: string): PrimaryFraudCheckClaim {
  return new PrimaryFraudCheckClaim(code, label, 0, 0, 0, "", 0, "", 0, "", "planned");
}
