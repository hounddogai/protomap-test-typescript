/**
 * The weighted reply template records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reply template is in its life cycle. */
export type WeightedReplyTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted reply template as the reply team keeps it. */
export class WeightedReplyTemplate {
  code: string;
  name: string;
  externalRef: string;
  active: boolean;
  amount: number;
  audienceId: string;
  status: WeightedReplyTemplateStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    active: boolean,
    amount: number,
    audienceId: string,
    status: WeightedReplyTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.active = active;
    this.amount = amount;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedReplyTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
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

  moveTo(next: WeightedReplyTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reply template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): WeightedReplyTemplate {
    return new WeightedReplyTemplate(
      this.code,
      this.name,
      this.externalRef,
      this.active,
      this.amount,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted reply template in status idle. */
export function newWeightedReplyTemplate(code: string, name: string): WeightedReplyTemplate {
  return new WeightedReplyTemplate(code, name, "", false, 0, "", "idle");
}
