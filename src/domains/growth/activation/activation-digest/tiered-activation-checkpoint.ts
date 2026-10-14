import * as text from "../../../../kit/text.js";

/** Where a tiered activation checkpoint is in its life cycle. */
export type TieredActivationCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A tiered activation checkpoint. Its code is unique within a tenant. */
export class TieredActivationCheckpoint {
  code: string;
  name: string;
  source: string;
  country: string;
  expiresAt: number;
  budget: number;
  summary: string;
  currency: string;
  status: TieredActivationCheckpointStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    country: string,
    expiresAt: number,
    budget: number,
    summary: string,
    currency: string,
    status: TieredActivationCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.country = country;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.summary = summary;
    this.currency = currency;
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

  canMoveTo(next: TieredActivationCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredActivationCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered activation checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.expiresAt - this.budget) * 100) / 100;
  }

  copy(): TieredActivationCheckpoint {
    return new TieredActivationCheckpoint(
      this.code,
      this.name,
      this.source,
      this.country,
      this.expiresAt,
      this.budget,
      this.summary,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered activation checkpoint in status created. */
export function newTieredActivationCheckpoint(code: string, name: string): TieredActivationCheckpoint {
  return new TieredActivationCheckpoint(code, name, "", "", 0, 0, "", "", "created");
}
