/**
 * The default exit rule forecast records of journeys's exit rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default exit rule forecast is in its life cycle. */
export type DefaultExitRuleForecastStatus = "created" | "validated" | "published" | "retired";

/** A default exit rule forecast as the exit rule team keeps it. */
export class DefaultExitRuleForecast {
  code: string;
  title: string;
  maximum: number;
  channel: string;
  priority: number;
  threshold: number;
  externalRef: string;
  weight: number;
  status: DefaultExitRuleForecastStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    channel: string,
    priority: number,
    threshold: number,
    externalRef: string,
    weight: number,
    status: DefaultExitRuleForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.channel = channel;
    this.priority = priority;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.weight = weight;
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

  canMoveTo(next: DefaultExitRuleForecastStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
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

  moveTo(next: DefaultExitRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default exit rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default exit rule forecast"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.maximum + this.priority) * 100) / 100;
  }

  copy(): DefaultExitRuleForecast {
    return new DefaultExitRuleForecast(
      this.code,
      this.title,
      this.maximum,
      this.channel,
      this.priority,
      this.threshold,
      this.externalRef,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default exit rule forecast in status created. */
export function newDefaultExitRuleForecast(code: string, title: string): DefaultExitRuleForecast {
  return new DefaultExitRuleForecast(code, title, 0, "", 0, 0, "", 0, "created");
}
