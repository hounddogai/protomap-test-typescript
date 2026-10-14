import * as text from "../../../../kit/text.js";

/** Where a sender preference is in its life cycle. */
export type SenderPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A sender preference as the sender team keeps it. */
export class SenderPreference {
  code: string;
  name: string;
  source: string;
  channel: string;
  rate: number;
  timezone: string;
  graceDays: number;
  audienceId: string;
  clicks: number;
  status: SenderPreferenceStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    channel: string,
    rate: number,
    timezone: string,
    graceDays: number,
    audienceId: string,
    clicks: number,
    status: SenderPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.channel = channel;
    this.rate = rate;
    this.timezone = timezone;
    this.graceDays = graceDays;
    this.audienceId = audienceId;
    this.clicks = clicks;
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

  canMoveTo(next: SenderPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round(this.rate * this.graceDays * 100) / 100;
  }

  copy(): SenderPreference {
    return new SenderPreference(
      this.code,
      this.name,
      this.source,
      this.channel,
      this.rate,
      this.timezone,
      this.graceDays,
      this.audienceId,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a sender preference in status proposed. */
export function newSenderPreference(code: string, name: string): SenderPreference {
  return new SenderPreference(code, name, "", "", 0, "", 0, "", 0, "proposed");
}
