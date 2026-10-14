import * as text from "../../../../kit/text.js";

/** Where a paywall policy is in its life cycle. */
export type PaywallPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A paywall policy as the paywall team keeps it. */
export class PaywallPolicy {
  code: string;
  name: string;
  description: string;
  ceiling: number;
  summary: string;
  ratio: number;
  createdAt: number;
  locale: string;
  windowDays: number;
  durationMinutes: number;
  status: PaywallPolicyStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    ceiling: number,
    summary: string,
    ratio: number,
    createdAt: number,
    locale: string,
    windowDays: number,
    durationMinutes: number,
    status: PaywallPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.ceiling = ceiling;
    this.summary = summary;
    this.ratio = ratio;
    this.createdAt = createdAt;
    this.locale = locale;
    this.windowDays = windowDays;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: PaywallPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
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

  moveTo(next: PaywallPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.createdAt + this.windowDays) * 100) / 100;
  }

  copy(): PaywallPolicy {
    return new PaywallPolicy(
      this.code,
      this.name,
      this.description,
      this.ceiling,
      this.summary,
      this.ratio,
      this.createdAt,
      this.locale,
      this.windowDays,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a paywall policy in status planned. */
export function newPaywallPolicy(code: string, name: string): PaywallPolicy {
  return new PaywallPolicy(code, name, "", 0, "", 0, 0, "", 0, 0, "planned");
}
