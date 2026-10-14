import * as text from "../../../../kit/text.js";

/** Where a exit rule request is in its life cycle. */
export type ExitRuleRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One exit rule request, with what the planners need to act on it. */
export class ExitRuleRequest {
  code: string;
  title: string;
  windowDays: number;
  threshold: number;
  phone: string;
  bid: number;
  graceDays: number;
  attributes: Map<string, string>;
  status: ExitRuleRequestStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    threshold: number,
    phone: string,
    bid: number,
    graceDays: number,
    attributes: Map<string, string>,
    status: ExitRuleRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.threshold = threshold;
    this.phone = phone;
    this.bid = bid;
    this.graceDays = graceDays;
    this.attributes = attributes;
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

  canMoveTo(next: ExitRuleRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ExitRuleRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule request"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round(this.bid * this.threshold * 100) / 100;
  }

  copy(): ExitRuleRequest {
    return new ExitRuleRequest(
      this.code,
      this.title,
      this.windowDays,
      this.threshold,
      this.phone,
      this.bid,
      this.graceDays,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule request in status planned. */
export function newExitRuleRequest(code: string, title: string): ExitRuleRequest {
  return new ExitRuleRequest(code, title, 0, 0, "", 0, 0, new Map<string, string>(), "planned");
}
