import * as text from "../../../../kit/text.js";

/** Where a global model tier is in its life cycle. */
export type GlobalModelTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global model tier and its current status. */
export class GlobalModelTier {
  code: string;
  name: string;
  contactEmail: string;
  unit: string;
  priority: number;
  status: GlobalModelTierStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    unit: string,
    priority: number,
    status: GlobalModelTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.unit = unit;
    this.priority = priority;
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

  canMoveTo(next: GlobalModelTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalModelTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global model tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): GlobalModelTier {
    return new GlobalModelTier(this.code, this.name, this.contactEmail, this.unit, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global model tier in status draft. */
export function newGlobalModelTier(code: string, name: string): GlobalModelTier {
  return new GlobalModelTier(code, name, "", "", 0, "draft");
}
