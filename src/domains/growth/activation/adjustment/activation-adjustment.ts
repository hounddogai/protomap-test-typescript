/**
 * The activation adjustment records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation adjustment is in its life cycle. */
export type ActivationAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A activation adjustment. Its code is unique within a tenant. */
export class ActivationAdjustment {
  code: string;
  title: string;
  journeyId: string;
  contactEmail: string;
  visible: boolean;
  rate: number;
  channel: string;
  variant: string;
  status: ActivationAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    contactEmail: string,
    visible: boolean,
    rate: number,
    channel: string,
    variant: string,
    status: ActivationAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.rate = rate;
    this.channel = channel;
    this.variant = variant;
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

  canMoveTo(next: ActivationAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: ActivationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"activation adjustment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): ActivationAdjustment {
    return new ActivationAdjustment(
      this.code,
      this.title,
      this.journeyId,
      this.contactEmail,
      this.visible,
      this.rate,
      this.channel,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a activation adjustment in status idle. */
export function newActivationAdjustment(code: string, title: string): ActivationAdjustment {
  return new ActivationAdjustment(code, title, "", "", false, 0, "", "", "idle");
}
