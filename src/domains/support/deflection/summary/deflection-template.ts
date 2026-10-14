import * as text from "../../../../kit/text.js";

/** Where a deflection template is in its life cycle. */
export type DeflectionTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A deflection template as the deflection team keeps it. */
export class DeflectionTemplate {
  code: string;
  name: string;
  score: number;
  threshold: number;
  locale: string;
  campaignRef: string;
  summary: string;
  endsAt: number;
  currency: string;
  expiresAt: number;
  status: DeflectionTemplateStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    threshold: number,
    locale: string,
    campaignRef: string,
    summary: string,
    endsAt: number,
    currency: string,
    expiresAt: number,
    status: DeflectionTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.threshold = threshold;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.summary = summary;
    this.endsAt = endsAt;
    this.currency = currency;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.threshold + this.expiresAt) * 100) / 100;
  }

  copy(): DeflectionTemplate {
    return new DeflectionTemplate(
      this.code,
      this.name,
      this.score,
      this.threshold,
      this.locale,
      this.campaignRef,
      this.summary,
      this.endsAt,
      this.currency,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a deflection template in status idle. */
export function newDeflectionTemplate(code: string, name: string): DeflectionTemplate {
  return new DeflectionTemplate(code, name, 0, 0, "", "", "", 0, "", 0, "idle");
}
