/**
 * The escalation bundle records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation bundle is in its life cycle. */
export type EscalationBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** A escalation bundle as the escalation team keeps it. */
export class EscalationBundle {
  code: string;
  label: string;
  capacity: number;
  externalRef: string;
  channel: string;
  weight: number;
  durationMinutes: number;
  locale: string;
  active: boolean;
  status: EscalationBundleStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    externalRef: string,
    channel: string,
    weight: number,
    durationMinutes: number,
    locale: string,
    active: boolean,
    status: EscalationBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.externalRef = externalRef;
    this.channel = channel;
    this.weight = weight;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: EscalationBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netValue(): number {
    return Math.round((this.capacity - this.durationMinutes) * 100) / 100;
  }

  copy(): EscalationBundle {
    return new EscalationBundle(
      this.code,
      this.label,
      this.capacity,
      this.externalRef,
      this.channel,
      this.weight,
      this.durationMinutes,
      this.locale,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a escalation bundle in status requested. */
export function newEscalationBundle(code: string, label: string): EscalationBundle {
  return new EscalationBundle(code, label, 0, "", "", 0, 0, "", false, "requested");
}
