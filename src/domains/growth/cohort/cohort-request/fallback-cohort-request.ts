/**
 * The fallback cohort request records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback cohort request is in its life cycle. */
export type FallbackCohortRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback cohort request as the cohort team keeps it. */
export class FallbackCohortRequest {
  code: string;
  name: string;
  visible: boolean;
  journeyId: string;
  description: string;
  priority: number;
  status: FallbackCohortRequestStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    journeyId: string,
    description: string,
    priority: number,
    status: FallbackCohortRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.journeyId = journeyId;
    this.description = description;
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

  canMoveTo(next: FallbackCohortRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
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

  moveTo(next: FallbackCohortRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback cohort request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback cohort request"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): FallbackCohortRequest {
    return new FallbackCohortRequest(
      this.code,
      this.name,
      this.visible,
      this.journeyId,
      this.description,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback cohort request in status draft. */
export function newFallbackCohortRequest(code: string, name: string): FallbackCohortRequest {
  return new FallbackCohortRequest(code, name, false, "", "", 0, "draft");
}
