/**
 * The touchpoint request records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint request is in its life cycle. */
export type TouchpointRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One touchpoint request, with what the planners need to act on it. */
export class TouchpointRequest {
  code: string;
  name: string;
  cohort: string;
  sequence: number;
  createdAt: number;
  cost: number;
  status: TouchpointRequestStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    sequence: number,
    createdAt: number,
    cost: number,
    status: TouchpointRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.sequence = sequence;
    this.createdAt = createdAt;
    this.cost = cost;
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

  canMoveTo(next: TouchpointRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TouchpointRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.cost + this.sequence) * 100) / 100;
  }

  copy(): TouchpointRequest {
    return new TouchpointRequest(
      this.code,
      this.name,
      this.cohort,
      this.sequence,
      this.createdAt,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a touchpoint request in status draft. */
export function newTouchpointRequest(code: string, name: string): TouchpointRequest {
  return new TouchpointRequest(code, name, "", 0, 0, 0, "draft");
}
