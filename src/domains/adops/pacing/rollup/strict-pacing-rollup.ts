import * as text from "../../../../kit/text.js";

/** Where a strict pacing rollup is in its life cycle. */
export type StrictPacingRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict pacing rollup as the pacing team keeps it. */
export class StrictPacingRollup {
  code: string;
  title: string;
  phone: string;
  cohort: string;
  conversionRate: number;
  locale: string;
  status: StrictPacingRollupStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    cohort: string,
    conversionRate: number,
    locale: string,
    status: StrictPacingRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.cohort = cohort;
    this.conversionRate = conversionRate;
    this.locale = locale;
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

  canMoveTo(next: StrictPacingRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
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

  moveTo(next: StrictPacingRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict pacing rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): StrictPacingRollup {
    return new StrictPacingRollup(
      this.code,
      this.title,
      this.phone,
      this.cohort,
      this.conversionRate,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict pacing rollup in status idle. */
export function newStrictPacingRollup(code: string, title: string): StrictPacingRollup {
  return new StrictPacingRollup(code, title, "", "", 0, "", "idle");
}
