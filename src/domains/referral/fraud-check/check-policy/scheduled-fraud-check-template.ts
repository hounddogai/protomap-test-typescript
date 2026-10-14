import * as text from "../../../../kit/text.js";

/** Where a scheduled fraud check template is in its life cycle. */
export type ScheduledFraudCheckTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One scheduled fraud check template, with what the planners need to act on it. */
export class ScheduledFraudCheckTemplate {
  code: string;
  title: string;
  source: string;
  attempts: number;
  active: boolean;
  description: string;
  score: number;
  conversionRate: number;
  locale: string;
  durationMinutes: number;
  status: ScheduledFraudCheckTemplateStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    attempts: number,
    active: boolean,
    description: string,
    score: number,
    conversionRate: number,
    locale: string,
    durationMinutes: number,
    status: ScheduledFraudCheckTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.attempts = attempts;
    this.active = active;
    this.description = description;
    this.score = score;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ScheduledFraudCheckTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFraudCheckTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled fraud check template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netVolume(): number {
    return Math.round((this.durationMinutes - this.attempts) * 100) / 100;
  }

  copy(): ScheduledFraudCheckTemplate {
    return new ScheduledFraudCheckTemplate(
      this.code,
      this.title,
      this.source,
      this.attempts,
      this.active,
      this.description,
      this.score,
      this.conversionRate,
      this.locale,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled fraud check template in status idle. */
export function newScheduledFraudCheckTemplate(code: string, title: string): ScheduledFraudCheckTemplate {
  return new ScheduledFraudCheckTemplate(code, title, "", 0, false, "", 0, 0, "", 0, "idle");
}
