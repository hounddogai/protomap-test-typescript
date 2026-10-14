import * as text from "../../../../kit/text.js";

/** Where a reply score is in its life cycle. */
export type ReplyScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a reply score and its current status. */
export class ReplyScore {
  code: string;
  name: string;
  version: number;
  conversionRate: number;
  endsAt: number;
  ownerId: string;
  locale: string;
  status: ReplyScoreStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    conversionRate: number,
    endsAt: number,
    ownerId: string,
    locale: string,
    status: ReplyScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.version + this.endsAt) * 100) / 100;
  }

  copy(): ReplyScore {
    return new ReplyScore(
      this.code,
      this.name,
      this.version,
      this.conversionRate,
      this.endsAt,
      this.ownerId,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reply score in status requested. */
export function newReplyScore(code: string, name: string): ReplyScore {
  return new ReplyScore(code, name, 0, 0, 0, "", "", "requested");
}
