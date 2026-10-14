import * as text from "../../../../kit/text.js";

/** Where a seasonal double opt in audit is in its life cycle. */
export type SeasonalDoubleOptInAuditStatus = "created" | "validated" | "published" | "retired";

/** A seasonal double opt in audit. Its code is unique within a tenant. */
export class SeasonalDoubleOptInAudit {
  code: string;
  label: string;
  channel: string;
  endsAt: number;
  quantity: number;
  cost: number;
  weight: number;
  description: string;
  status: SeasonalDoubleOptInAuditStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    endsAt: number,
    quantity: number,
    cost: number,
    weight: number,
    description: string,
    status: SeasonalDoubleOptInAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.cost = cost;
    this.weight = weight;
    this.description = description;
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

  canMoveTo(next: SeasonalDoubleOptInAuditStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalDoubleOptInAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal double opt in audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.weight - this.cost) * 100) / 100;
  }

  copy(): SeasonalDoubleOptInAudit {
    return new SeasonalDoubleOptInAudit(
      this.code,
      this.label,
      this.channel,
      this.endsAt,
      this.quantity,
      this.cost,
      this.weight,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal double opt in audit in status created. */
export function newSeasonalDoubleOptInAudit(code: string, label: string): SeasonalDoubleOptInAudit {
  return new SeasonalDoubleOptInAudit(code, label, "", 0, 0, 0, 0, "", "created");
}
