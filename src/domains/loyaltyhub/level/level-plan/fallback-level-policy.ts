import * as text from "../../../../kit/text.js";

/** Where a fallback level policy is in its life cycle. */
export type FallbackLevelPolicyStatus = "created" | "validated" | "published" | "retired";

/** One fallback level policy, with what the planners need to act on it. */
export class FallbackLevelPolicy {
  code: string;
  title: string;
  approved: boolean;
  capacity: number;
  floorValue: number;
  channel: string;
  active: boolean;
  externalRef: string;
  windowDays: number;
  audienceId: string;
  status: FallbackLevelPolicyStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    capacity: number,
    floorValue: number,
    channel: string,
    active: boolean,
    externalRef: string,
    windowDays: number,
    audienceId: string,
    status: FallbackLevelPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.channel = channel;
    this.active = active;
    this.externalRef = externalRef;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
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

  canMoveTo(next: FallbackLevelPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackLevelPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback level policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.windowDays - this.capacity) * 100) / 100;
  }

  copy(): FallbackLevelPolicy {
    return new FallbackLevelPolicy(
      this.code,
      this.title,
      this.approved,
      this.capacity,
      this.floorValue,
      this.channel,
      this.active,
      this.externalRef,
      this.windowDays,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback level policy in status created. */
export function newFallbackLevelPolicy(code: string, title: string): FallbackLevelPolicy {
  return new FallbackLevelPolicy(code, title, false, 0, 0, "", false, "", 0, "", "created");
}
