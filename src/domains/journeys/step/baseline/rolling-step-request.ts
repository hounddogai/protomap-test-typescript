import * as text from "../../../../kit/text.js";

/** Where a rolling step request is in its life cycle. */
export type RollingStepRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling step request, with what the planners need to act on it. */
export class RollingStepRequest {
  code: string;
  name: string;
  priority: number;
  version: number;
  capacity: number;
  phone: string;
  minimum: number;
  frequencyCap: number;
  ownerId: string;
  externalRef: string;
  status: RollingStepRequestStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    version: number,
    capacity: number,
    phone: string,
    minimum: number,
    frequencyCap: number,
    ownerId: string,
    externalRef: string,
    status: RollingStepRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.version = version;
    this.capacity = capacity;
    this.phone = phone;
    this.minimum = minimum;
    this.frequencyCap = frequencyCap;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
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

  canMoveTo(next: RollingStepRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingStepRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling step request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.capacity + this.frequencyCap) * 100) / 100;
  }

  copy(): RollingStepRequest {
    return new RollingStepRequest(
      this.code,
      this.name,
      this.priority,
      this.version,
      this.capacity,
      this.phone,
      this.minimum,
      this.frequencyCap,
      this.ownerId,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling step request in status draft. */
export function newRollingStepRequest(code: string, name: string): RollingStepRequest {
  return new RollingStepRequest(code, name, 0, 0, 0, "", 0, 0, "", "", "draft");
}
