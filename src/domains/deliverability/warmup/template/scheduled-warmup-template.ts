/**
 * The scheduled warmup template records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled warmup template is in its life cycle. */
export type ScheduledWarmupTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a scheduled warmup template and its current status. */
export class ScheduledWarmupTemplate {
  code: string;
  title: string;
  locale: string;
  minimum: number;
  utmSource: string;
  frequencyCap: number;
  margin: number;
  status: ScheduledWarmupTemplateStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    minimum: number,
    utmSource: string,
    frequencyCap: number,
    margin: number,
    status: ScheduledWarmupTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.minimum = minimum;
    this.utmSource = utmSource;
    this.frequencyCap = frequencyCap;
    this.margin = margin;
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

  canMoveTo(next: ScheduledWarmupTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ScheduledWarmupTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled warmup template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.minimum * this.margin * 100) / 100;
  }

  copy(): ScheduledWarmupTemplate {
    return new ScheduledWarmupTemplate(
      this.code,
      this.title,
      this.locale,
      this.minimum,
      this.utmSource,
      this.frequencyCap,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled warmup template in status idle. */
export function newScheduledWarmupTemplate(code: string, title: string): ScheduledWarmupTemplate {
  return new ScheduledWarmupTemplate(code, title, "", 0, "", 0, 0, "idle");
}
