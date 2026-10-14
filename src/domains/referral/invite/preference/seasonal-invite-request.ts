import * as text from "../../../../kit/text.js";

/** Where a seasonal invite request is in its life cycle. */
export type SeasonalInviteRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a seasonal invite request and its current status. */
export class SeasonalInviteRequest {
  code: string;
  name: string;
  budget: number;
  updatedAt: number;
  notes: string;
  title: string;
  rate: number;
  phone: string;
  weight: number;
  reviewer: string;
  status: SeasonalInviteRequestStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    updatedAt: number,
    notes: string,
    title: string,
    rate: number,
    phone: string,
    weight: number,
    reviewer: string,
    status: SeasonalInviteRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.notes = notes;
    this.title = title;
    this.rate = rate;
    this.phone = phone;
    this.weight = weight;
    this.reviewer = reviewer;
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

  canMoveTo(next: SeasonalInviteRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: SeasonalInviteRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal invite request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.rate - this.updatedAt) * 100) / 100;
  }

  copy(): SeasonalInviteRequest {
    return new SeasonalInviteRequest(
      this.code,
      this.name,
      this.budget,
      this.updatedAt,
      this.notes,
      this.title,
      this.rate,
      this.phone,
      this.weight,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal invite request in status idle. */
export function newSeasonalInviteRequest(code: string, name: string): SeasonalInviteRequest {
  return new SeasonalInviteRequest(code, name, 0, 0, "", "", 0, "", 0, "", "idle");
}
