import * as text from "../../../../kit/text.js";

/** Where a warmup policy is in its life cycle. */
export type WarmupPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A warmup policy. Its code is unique within a tenant. */
export class WarmupPolicy {
  code: string;
  name: string;
  durationMinutes: number;
  score: number;
  minimum: number;
  budget: number;
  conversionRate: number;
  tags: string[];
  status: WarmupPolicyStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    score: number,
    minimum: number,
    budget: number,
    conversionRate: number,
    tags: string[],
    status: WarmupPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.score = score;
    this.minimum = minimum;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.tags = tags;
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

  canMoveTo(next: WarmupPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round(this.conversionRate * this.minimum * 100) / 100;
  }

  copy(): WarmupPolicy {
    return new WarmupPolicy(
      this.code,
      this.name,
      this.durationMinutes,
      this.score,
      this.minimum,
      this.budget,
      this.conversionRate,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a warmup policy in status planned. */
export function newWarmupPolicy(code: string, name: string): WarmupPolicy {
  return new WarmupPolicy(code, name, 0, 0, 0, 0, 0, [], "planned");
}
