import * as text from "../../../../kit/text.js";

/** Where a primary complaint budget is in its life cycle. */
export type PrimaryComplaintBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One primary complaint budget, with what the planners need to act on it. */
export class PrimaryComplaintBudget {
  code: string;
  name: string;
  expiresAt: number;
  journeyId: string;
  openRate: number;
  batchSize: number;
  utmSource: string;
  createdAt: number;
  description: string;
  discount: number;
  channel: string;
  status: PrimaryComplaintBudgetStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    journeyId: string,
    openRate: number,
    batchSize: number,
    utmSource: string,
    createdAt: number,
    description: string,
    discount: number,
    channel: string,
    status: PrimaryComplaintBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.journeyId = journeyId;
    this.openRate = openRate;
    this.batchSize = batchSize;
    this.utmSource = utmSource;
    this.createdAt = createdAt;
    this.description = description;
    this.discount = discount;
    this.channel = channel;
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

  canMoveTo(next: PrimaryComplaintBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryComplaintBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary complaint budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round(this.createdAt * this.expiresAt * 100) / 100;
  }

  copy(): PrimaryComplaintBudget {
    return new PrimaryComplaintBudget(
      this.code,
      this.name,
      this.expiresAt,
      this.journeyId,
      this.openRate,
      this.batchSize,
      this.utmSource,
      this.createdAt,
      this.description,
      this.discount,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary complaint budget in status proposed. */
export function newPrimaryComplaintBudget(code: string, name: string): PrimaryComplaintBudget {
  return new PrimaryComplaintBudget(code, name, 0, "", 0, 0, "", 0, "", 0, "", "proposed");
}
