/**
 * The reply template records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply template is in its life cycle. */
export type ReplyTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One reply template, with what the planners need to act on it. */
export class ReplyTemplate {
  code: string;
  label: string;
  weight: number;
  active: boolean;
  attempts: number;
  source: string;
  currency: string;
  conversionRate: number;
  score: number;
  status: ReplyTemplateStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    active: boolean,
    attempts: number,
    source: string,
    currency: string,
    conversionRate: number,
    score: number,
    status: ReplyTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.active = active;
    this.attempts = attempts;
    this.source = source;
    this.currency = currency;
    this.conversionRate = conversionRate;
    this.score = score;
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

  canMoveTo(next: ReplyTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
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
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.weight - this.attempts) * 100) / 100;
  }

  copy(): ReplyTemplate {
    return new ReplyTemplate(
      this.code,
      this.label,
      this.weight,
      this.active,
      this.attempts,
      this.source,
      this.currency,
      this.conversionRate,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reply template in status idle. */
export function newReplyTemplate(code: string, label: string): ReplyTemplate {
  return new ReplyTemplate(code, label, 0, false, 0, "", "", 0, 0, "idle");
}
