import * as text from "../../../../kit/text.js";

/** Where a tiered macro agreement is in its life cycle. */
export type TieredMacroAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered macro agreement. Its code is unique within a tenant. */
export class TieredMacroAgreement {
  code: string;
  title: string;
  updatedAt: number;
  threshold: number;
  windowDays: number;
  rate: number;
  batchSize: number;
  clicks: number;
  score: number;
  channel: string;
  status: TieredMacroAgreementStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    threshold: number,
    windowDays: number,
    rate: number,
    batchSize: number,
    clicks: number,
    score: number,
    channel: string,
    status: TieredMacroAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.rate = rate;
    this.batchSize = batchSize;
    this.clicks = clicks;
    this.score = score;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredMacroAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredMacroAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered macro agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered macro agreement"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.rate - this.score) * 100) / 100;
  }

  copy(): TieredMacroAgreement {
    return new TieredMacroAgreement(
      this.code,
      this.title,
      this.updatedAt,
      this.threshold,
      this.windowDays,
      this.rate,
      this.batchSize,
      this.clicks,
      this.score,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered macro agreement in status planned. */
export function newTieredMacroAgreement(code: string, title: string): TieredMacroAgreement {
  return new TieredMacroAgreement(code, title, 0, 0, 0, 0, 0, 0, 0, "", "planned");
}
