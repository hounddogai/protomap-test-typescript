import * as text from "../../../../kit/text.js";

/** Where a fraud check forecast is in its life cycle. */
export type FraudCheckForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fraud check forecast. Its code is unique within a tenant. */
export class FraudCheckForecast {
  code: string;
  name: string;
  reviewer: string;
  endsAt: number;
  quantity: number;
  source: string;
  sendAt: number;
  notes: string;
  visible: boolean;
  batchSize: number;
  discount: number;
  status: FraudCheckForecastStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    endsAt: number,
    quantity: number,
    source: string,
    sendAt: number,
    notes: string,
    visible: boolean,
    batchSize: number,
    discount: number,
    status: FraudCheckForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.source = source;
    this.sendAt = sendAt;
    this.notes = notes;
    this.visible = visible;
    this.batchSize = batchSize;
    this.discount = discount;
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

  canMoveTo(next: FraudCheckForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FraudCheckForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fraud check forecast"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.discount * this.batchSize * 100) / 100;
  }

  copy(): FraudCheckForecast {
    return new FraudCheckForecast(
      this.code,
      this.name,
      this.reviewer,
      this.endsAt,
      this.quantity,
      this.source,
      this.sendAt,
      this.notes,
      this.visible,
      this.batchSize,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fraud check forecast in status proposed. */
export function newFraudCheckForecast(code: string, name: string): FraudCheckForecast {
  return new FraudCheckForecast(code, name, "", 0, 0, "", 0, "", false, 0, 0, "proposed");
}
