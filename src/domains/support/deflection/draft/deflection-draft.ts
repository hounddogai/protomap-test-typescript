/**
 * The deflection draft records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection draft is in its life cycle. */
export type DeflectionDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a deflection draft and its current status. */
export class DeflectionDraft {
  code: string;
  title: string;
  phone: string;
  limit: number;
  channel: string;
  budget: number;
  checksum: string;
  unit: string;
  margin: number;
  name: string;
  amount: number;
  status: DeflectionDraftStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    limit: number,
    channel: string,
    budget: number,
    checksum: string,
    unit: string,
    margin: number,
    name: string,
    amount: number,
    status: DeflectionDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.limit = limit;
    this.channel = channel;
    this.budget = budget;
    this.checksum = checksum;
    this.unit = unit;
    this.margin = margin;
    this.name = name;
    this.amount = amount;
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

  canMoveTo(next: DeflectionDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
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

  moveTo(next: DeflectionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.margin + this.amount) * 100) / 100;
  }

  copy(): DeflectionDraft {
    return new DeflectionDraft(
      this.code,
      this.title,
      this.phone,
      this.limit,
      this.channel,
      this.budget,
      this.checksum,
      this.unit,
      this.margin,
      this.name,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a deflection draft in status idle. */
export function newDeflectionDraft(code: string, title: string): DeflectionDraft {
  return new DeflectionDraft(code, title, "", 0, "", 0, "", "", 0, "", 0, "idle");
}
