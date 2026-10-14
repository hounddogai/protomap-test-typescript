import * as text from "../../../../kit/text.js";

/** Where a capped conversion policy is in its life cycle. */
export type CappedConversionPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped conversion policy as the conversion team keeps it. */
export class CappedConversionPolicy {
  code: string;
  name: string;
  phone: string;
  createdAt: number;
  ceiling: number;
  externalRef: string;
  status: CappedConversionPolicyStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    createdAt: number,
    ceiling: number,
    externalRef: string,
    status: CappedConversionPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
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

  canMoveTo(next: CappedConversionPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CappedConversionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped conversion policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.createdAt + this.ceiling) * 100) / 100;
  }

  copy(): CappedConversionPolicy {
    return new CappedConversionPolicy(
      this.code,
      this.name,
      this.phone,
      this.createdAt,
      this.ceiling,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped conversion policy in status planned. */
export function newCappedConversionPolicy(code: string, name: string): CappedConversionPolicy {
  return new CappedConversionPolicy(code, name, "", 0, 0, "", "planned");
}
