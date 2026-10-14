import * as text from "../../../../kit/text.js";

/** Where a rolling escalation score is in its life cycle. */
export type RollingEscalationScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling escalation score. Its code is unique within a tenant. */
export class RollingEscalationScore {
  code: string;
  name: string;
  timezone: string;
  endsAt: number;
  budget: number;
  variant: string;
  locale: string;
  openRate: number;
  status: RollingEscalationScoreStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    endsAt: number,
    budget: number,
    variant: string,
    locale: string,
    openRate: number,
    status: RollingEscalationScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.budget = budget;
    this.variant = variant;
    this.locale = locale;
    this.openRate = openRate;
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

  canMoveTo(next: RollingEscalationScoreStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingEscalationScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling escalation score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.openRate + this.budget) * 100) / 100;
  }

  copy(): RollingEscalationScore {
    return new RollingEscalationScore(
      this.code,
      this.name,
      this.timezone,
      this.endsAt,
      this.budget,
      this.variant,
      this.locale,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling escalation score in status new. */
export function newRollingEscalationScore(code: string, name: string): RollingEscalationScore {
  return new RollingEscalationScore(code, name, "", 0, 0, "", "", 0, "new");
}
