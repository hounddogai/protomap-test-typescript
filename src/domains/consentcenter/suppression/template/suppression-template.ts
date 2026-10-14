/**
 * The suppression template records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression template is in its life cycle. */
export type SuppressionTemplateStatus = "created" | "validated" | "published" | "retired";

/** The record of a suppression template and its current status. */
export class SuppressionTemplate {
  code: string;
  name: string;
  conversionRate: number;
  channel: string;
  region: string;
  segment: string;
  pinned: boolean;
  updatedAt: number;
  active: boolean;
  revision: number;
  attempts: number;
  status: SuppressionTemplateStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    channel: string,
    region: string,
    segment: string,
    pinned: boolean,
    updatedAt: number,
    active: boolean,
    revision: number,
    attempts: number,
    status: SuppressionTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.channel = channel;
    this.region = region;
    this.segment = segment;
    this.pinned = pinned;
    this.updatedAt = updatedAt;
    this.active = active;
    this.revision = revision;
    this.attempts = attempts;
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

  canMoveTo(next: SuppressionTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SuppressionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.conversionRate + this.attempts) * 100) / 100;
  }

  copy(): SuppressionTemplate {
    return new SuppressionTemplate(
      this.code,
      this.name,
      this.conversionRate,
      this.channel,
      this.region,
      this.segment,
      this.pinned,
      this.updatedAt,
      this.active,
      this.revision,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a suppression template in status created. */
export function newSuppressionTemplate(code: string, name: string): SuppressionTemplate {
  return new SuppressionTemplate(code, name, 0, "", "", "", false, 0, false, 0, 0, "created");
}
