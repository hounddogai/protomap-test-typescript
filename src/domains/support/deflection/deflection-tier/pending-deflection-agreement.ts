import * as text from "../../../../kit/text.js";

/** Where a pending deflection agreement is in its life cycle. */
export type PendingDeflectionAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending deflection agreement as the deflection team keeps it. */
export class PendingDeflectionAgreement {
  code: string;
  name: string;
  version: number;
  durationMinutes: number;
  budget: number;
  country: string;
  graceDays: number;
  approved: boolean;
  limit: number;
  channel: string;
  status: PendingDeflectionAgreementStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    durationMinutes: number,
    budget: number,
    country: string,
    graceDays: number,
    approved: boolean,
    limit: number,
    channel: string,
    status: PendingDeflectionAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.country = country;
    this.graceDays = graceDays;
    this.approved = approved;
    this.limit = limit;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingDeflectionAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingDeflectionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending deflection agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.limit - this.budget) * 100) / 100;
  }

  copy(): PendingDeflectionAgreement {
    return new PendingDeflectionAgreement(
      this.code,
      this.name,
      this.version,
      this.durationMinutes,
      this.budget,
      this.country,
      this.graceDays,
      this.approved,
      this.limit,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending deflection agreement in status new. */
export function newPendingDeflectionAgreement(code: string, name: string): PendingDeflectionAgreement {
  return new PendingDeflectionAgreement(code, name, 0, 0, 0, "", 0, false, 0, "", "new");
}
