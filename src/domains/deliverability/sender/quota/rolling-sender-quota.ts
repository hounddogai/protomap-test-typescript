/**
 * The rolling sender quota records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling sender quota is in its life cycle. */
export type RollingSenderQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling sender quota and its current status. */
export class RollingSenderQuota {
  code: string;
  name: string;
  weight: number;
  quantity: number;
  createdAt: number;
  phone: string;
  tags: string[];
  approved: boolean;
  ratio: number;
  status: RollingSenderQuotaStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    quantity: number,
    createdAt: number,
    phone: string,
    tags: string[],
    approved: boolean,
    ratio: number,
    status: RollingSenderQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.phone = phone;
    this.tags = tags;
    this.approved = approved;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingSenderQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingSenderQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling sender quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.weight - this.quantity) * 100) / 100;
  }

  copy(): RollingSenderQuota {
    return new RollingSenderQuota(
      this.code,
      this.name,
      this.weight,
      this.quantity,
      this.createdAt,
      this.phone,
      this.tags,
      this.approved,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling sender quota in status open. */
export function newRollingSenderQuota(code: string, name: string): RollingSenderQuota {
  return new RollingSenderQuota(code, name, 0, 0, 0, "", [], false, 0, "open");
}
