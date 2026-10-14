import * as text from "../../../../kit/text.js";

/** Where a primary preference request is in its life cycle. */
export type PrimaryPreferenceRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary preference request. Its code is unique within a tenant. */
export class PrimaryPreferenceRequest {
  code: string;
  label: string;
  expiresAt: number;
  cost: number;
  journeyId: string;
  attempts: number;
  priority: number;
  status: PrimaryPreferenceRequestStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    cost: number,
    journeyId: string,
    attempts: number,
    priority: number,
    status: PrimaryPreferenceRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.journeyId = journeyId;
    this.attempts = attempts;
    this.priority = priority;
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

  canMoveTo(next: PrimaryPreferenceRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPreferenceRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary preference request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary preference request"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.attempts * this.expiresAt * 100) / 100;
  }

  copy(): PrimaryPreferenceRequest {
    return new PrimaryPreferenceRequest(
      this.code,
      this.label,
      this.expiresAt,
      this.cost,
      this.journeyId,
      this.attempts,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary preference request in status planned. */
export function newPrimaryPreferenceRequest(code: string, label: string): PrimaryPreferenceRequest {
  return new PrimaryPreferenceRequest(code, label, 0, 0, "", 0, 0, "planned");
}
