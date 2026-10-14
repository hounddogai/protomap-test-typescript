import * as text from "../../../../kit/text.js";

/** Where a domain cycle is in its life cycle. */
export type DomainCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One domain cycle, with what the planners need to act on it. */
export class DomainCycle {
  code: string;
  name: string;
  variant: string;
  contactEmail: string;
  utmSource: string;
  unit: string;
  journeyId: string;
  capacity: number;
  status: DomainCycleStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    contactEmail: string,
    utmSource: string,
    unit: string,
    journeyId: string,
    capacity: number,
    status: DomainCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.contactEmail = contactEmail;
    this.utmSource = utmSource;
    this.unit = unit;
    this.journeyId = journeyId;
    this.capacity = capacity;
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

  canMoveTo(next: DomainCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DomainCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"domain cycle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): DomainCycle {
    return new DomainCycle(
      this.code,
      this.name,
      this.variant,
      this.contactEmail,
      this.utmSource,
      this.unit,
      this.journeyId,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a domain cycle in status draft. */
export function newDomainCycle(code: string, name: string): DomainCycle {
  return new DomainCycle(code, name, "", "", "", "", "", 0, "draft");
}
