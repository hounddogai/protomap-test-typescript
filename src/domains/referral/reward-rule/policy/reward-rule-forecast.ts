import * as text from "../../../../kit/text.js";

/** Where a reward rule forecast is in its life cycle. */
export type RewardRuleForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** One reward rule forecast, with what the planners need to act on it. */
export class RewardRuleForecast {
  code: string;
  label: string;
  utmSource: string;
  visible: boolean;
  description: string;
  startsAt: number;
  status: RewardRuleForecastStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    visible: boolean,
    description: string,
    startsAt: number,
    status: RewardRuleForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.visible = visible;
    this.description = description;
    this.startsAt = startsAt;
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

  canMoveTo(next: RewardRuleForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): RewardRuleForecast {
    return new RewardRuleForecast(
      this.code,
      this.label,
      this.utmSource,
      this.visible,
      this.description,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a reward rule forecast in status requested. */
export function newRewardRuleForecast(code: string, label: string): RewardRuleForecast {
  return new RewardRuleForecast(code, label, "", false, "", 0, "requested");
}
