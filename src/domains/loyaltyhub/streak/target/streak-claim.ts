import * as text from "../../../../kit/text.js";

/** Where a streak claim is in its life cycle. */
export type StreakClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One streak claim, with what the planners need to act on it. */
export class StreakClaim {
  code: string;
  name: string;
  weight: number;
  endsAt: number;
  externalRef: string;
  priority: number;
  status: StreakClaimStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    endsAt: number,
    externalRef: string,
    priority: number,
    status: StreakClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
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

  canMoveTo(next: StreakClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StreakClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.priority - this.endsAt) * 100) / 100;
  }

  copy(): StreakClaim {
    return new StreakClaim(
      this.code,
      this.name,
      this.weight,
      this.endsAt,
      this.externalRef,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a streak claim in status planned. */
export function newStreakClaim(code: string, name: string): StreakClaim {
  return new StreakClaim(code, name, 0, 0, "", 0, "planned");
}
