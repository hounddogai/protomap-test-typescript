import * as text from "../../../../kit/text.js";

/** Where a adaptive paywall template is in its life cycle. */
export type AdaptivePaywallTemplateStatus = "created" | "validated" | "published" | "retired";

/** A adaptive paywall template as the paywall team keeps it. */
export class AdaptivePaywallTemplate {
  code: string;
  name: string;
  attempts: number;
  sendAt: number;
  locale: string;
  startsAt: number;
  title: string;
  status: AdaptivePaywallTemplateStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    sendAt: number,
    locale: string,
    startsAt: number,
    title: string,
    status: AdaptivePaywallTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.locale = locale;
    this.startsAt = startsAt;
    this.title = title;
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

  canMoveTo(next: AdaptivePaywallTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePaywallTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive paywall template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.startsAt + this.sendAt) * 100) / 100;
  }

  copy(): AdaptivePaywallTemplate {
    return new AdaptivePaywallTemplate(
      this.code,
      this.name,
      this.attempts,
      this.sendAt,
      this.locale,
      this.startsAt,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive paywall template in status created. */
export function newAdaptivePaywallTemplate(code: string, name: string): AdaptivePaywallTemplate {
  return new AdaptivePaywallTemplate(code, name, 0, 0, "", 0, "", "created");
}
