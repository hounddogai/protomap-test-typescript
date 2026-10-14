import * as text from "../../../../kit/text.js";

/** Where a deflection variance is in its life cycle. */
export type DeflectionVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A deflection variance as the deflection team keeps it. */
export class DeflectionVariance {
  code: string;
  name: string;
  visible: boolean;
  attempts: number;
  summary: string;
  expiresAt: number;
  conversionRate: number;
  locale: string;
  startsAt: number;
  status: DeflectionVarianceStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    attempts: number,
    summary: string,
    expiresAt: number,
    conversionRate: number,
    locale: string,
    startsAt: number,
    status: DeflectionVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.attempts = attempts;
    this.summary = summary;
    this.expiresAt = expiresAt;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"deflection variance"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.attempts + this.startsAt) * 100) / 100;
  }

  copy(): DeflectionVariance {
    return new DeflectionVariance(
      this.code,
      this.name,
      this.visible,
      this.attempts,
      this.summary,
      this.expiresAt,
      this.conversionRate,
      this.locale,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a deflection variance in status new. */
export function newDeflectionVariance(code: string, name: string): DeflectionVariance {
  return new DeflectionVariance(code, name, false, 0, "", 0, 0, "", 0, "new");
}
