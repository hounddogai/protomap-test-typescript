/**
 * The regional csat proposal records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional csat proposal is in its life cycle. */
export type RegionalCsatProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional csat proposal. Its code is unique within a tenant. */
export class RegionalCsatProposal {
  code: string;
  label: string;
  country: string;
  ceiling: number;
  currency: string;
  channel: string;
  discount: number;
  retries: number;
  locale: string;
  attributes: Map<string, string>;
  status: RegionalCsatProposalStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    ceiling: number,
    currency: string,
    channel: string,
    discount: number,
    retries: number,
    locale: string,
    attributes: Map<string, string>,
    status: RegionalCsatProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.ceiling = ceiling;
    this.currency = currency;
    this.channel = channel;
    this.discount = discount;
    this.retries = retries;
    this.locale = locale;
    this.attributes = attributes;
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

  canMoveTo(next: RegionalCsatProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalCsatProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional csat proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.retries - this.ceiling) * 100) / 100;
  }

  copy(): RegionalCsatProposal {
    return new RegionalCsatProposal(
      this.code,
      this.label,
      this.country,
      this.ceiling,
      this.currency,
      this.channel,
      this.discount,
      this.retries,
      this.locale,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional csat proposal in status idle. */
export function newRegionalCsatProposal(code: string, label: string): RegionalCsatProposal {
  return new RegionalCsatProposal(code, label, "", 0, "", "", 0, 0, "", new Map<string, string>(), "idle");
}
