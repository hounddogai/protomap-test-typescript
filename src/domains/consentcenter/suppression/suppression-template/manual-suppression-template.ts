/**
 * The manual suppression template records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual suppression template is in its life cycle. */
export type ManualSuppressionTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual suppression template as the suppression team keeps it. */
export class ManualSuppressionTemplate {
  code: string;
  label: string;
  sequence: number;
  amount: number;
  weight: number;
  sendAt: number;
  description: string;
  channel: string;
  cost: number;
  variant: string;
  bid: number;
  status: ManualSuppressionTemplateStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    amount: number,
    weight: number,
    sendAt: number,
    description: string,
    channel: string,
    cost: number,
    variant: string,
    bid: number,
    status: ManualSuppressionTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.amount = amount;
    this.weight = weight;
    this.sendAt = sendAt;
    this.description = description;
    this.channel = channel;
    this.cost = cost;
    this.variant = variant;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualSuppressionTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualSuppressionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual suppression template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.cost + this.bid) * 100) / 100;
  }

  copy(): ManualSuppressionTemplate {
    return new ManualSuppressionTemplate(
      this.code,
      this.label,
      this.sequence,
      this.amount,
      this.weight,
      this.sendAt,
      this.description,
      this.channel,
      this.cost,
      this.variant,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual suppression template in status draft. */
export function newManualSuppressionTemplate(code: string, label: string): ManualSuppressionTemplate {
  return new ManualSuppressionTemplate(code, label, 0, 0, 0, 0, "", "", 0, "", 0, "draft");
}
