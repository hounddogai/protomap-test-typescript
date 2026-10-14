/**
 * The primary ticket view checkpoint records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary ticket view checkpoint is in its life cycle. */
export type PrimaryTicketViewCheckpointStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary ticket view checkpoint. Its code is unique within a tenant. */
export class PrimaryTicketViewCheckpoint {
  code: string;
  title: string;
  externalRef: string;
  quantity: number;
  budget: number;
  region: string;
  sequence: number;
  rate: number;
  category: string;
  frequencyCap: number;
  description: string;
  status: PrimaryTicketViewCheckpointStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    quantity: number,
    budget: number,
    region: string,
    sequence: number,
    rate: number,
    category: string,
    frequencyCap: number,
    description: string,
    status: PrimaryTicketViewCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.quantity = quantity;
    this.budget = budget;
    this.region = region;
    this.sequence = sequence;
    this.rate = rate;
    this.category = category;
    this.frequencyCap = frequencyCap;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryTicketViewCheckpointStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryTicketViewCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary ticket view checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary ticket view checkpoint"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.rate - this.sequence) * 100) / 100;
  }

  copy(): PrimaryTicketViewCheckpoint {
    return new PrimaryTicketViewCheckpoint(
      this.code,
      this.title,
      this.externalRef,
      this.quantity,
      this.budget,
      this.region,
      this.sequence,
      this.rate,
      this.category,
      this.frequencyCap,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a primary ticket view checkpoint in status proposed. */
export function newPrimaryTicketViewCheckpoint(code: string, title: string): PrimaryTicketViewCheckpoint {
  return new PrimaryTicketViewCheckpoint(code, title, "", 0, 0, "", 0, 0, "", 0, "", "proposed");
}
