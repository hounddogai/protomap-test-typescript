import * as text from "../../../../kit/text.js";

/** Where a fallback reward rule request is in its life cycle. */
export type FallbackRewardRuleRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One fallback reward rule request, with what the planners need to act on it. */
export class FallbackRewardRuleRequest {
  code: string;
  label: string;
  sequence: number;
  windowDays: number;
  priority: number;
  country: string;
  margin: number;
  frequencyCap: number;
  title: string;
  timezone: string;
  ceiling: number;
  status: FallbackRewardRuleRequestStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    windowDays: number,
    priority: number,
    country: string,
    margin: number,
    frequencyCap: number,
    title: string,
    timezone: string,
    ceiling: number,
    status: FallbackRewardRuleRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.windowDays = windowDays;
    this.priority = priority;
    this.country = country;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.title = title;
    this.timezone = timezone;
    this.ceiling = ceiling;
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

  canMoveTo(next: FallbackRewardRuleRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackRewardRuleRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward rule request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netValue(): number {
    return Math.round((this.ceiling - this.priority) * 100) / 100;
  }

  copy(): FallbackRewardRuleRequest {
    return new FallbackRewardRuleRequest(
      this.code,
      this.label,
      this.sequence,
      this.windowDays,
      this.priority,
      this.country,
      this.margin,
      this.frequencyCap,
      this.title,
      this.timezone,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback reward rule request in status draft. */
export function newFallbackRewardRuleRequest(code: string, label: string): FallbackRewardRuleRequest {
  return new FallbackRewardRuleRequest(code, label, 0, 0, 0, "", 0, 0, "", "", 0, "draft");
}
