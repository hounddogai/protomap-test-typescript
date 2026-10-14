import * as text from "../../../../kit/text.js";

/** Where a tiered fraud check preference is in its life cycle. */
export type TieredFraudCheckPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One tiered fraud check preference, with what the planners need to act on it. */
export class TieredFraudCheckPreference {
  code: string;
  name: string;
  sendAt: number;
  country: string;
  journeyId: string;
  amount: number;
  channel: string;
  limit: number;
  label: string;
  endsAt: number;
  revision: number;
  status: TieredFraudCheckPreferenceStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    country: string,
    journeyId: string,
    amount: number,
    channel: string,
    limit: number,
    label: string,
    endsAt: number,
    revision: number,
    status: TieredFraudCheckPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.country = country;
    this.journeyId = journeyId;
    this.amount = amount;
    this.channel = channel;
    this.limit = limit;
    this.label = label;
    this.endsAt = endsAt;
    this.revision = revision;
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

  canMoveTo(next: TieredFraudCheckPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredFraudCheckPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered fraud check preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"tiered fraud check preference"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.sendAt * this.revision * 100) / 100;
  }

  copy(): TieredFraudCheckPreference {
    return new TieredFraudCheckPreference(
      this.code,
      this.name,
      this.sendAt,
      this.country,
      this.journeyId,
      this.amount,
      this.channel,
      this.limit,
      this.label,
      this.endsAt,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered fraud check preference in status open. */
export function newTieredFraudCheckPreference(code: string, name: string): TieredFraudCheckPreference {
  return new TieredFraudCheckPreference(code, name, 0, "", "", 0, "", 0, "", 0, 0, "open");
}
