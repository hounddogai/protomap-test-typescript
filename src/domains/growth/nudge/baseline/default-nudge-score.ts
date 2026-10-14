import * as text from "../../../../kit/text.js";

/** Where a default nudge score is in its life cycle. */
export type DefaultNudgeScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default nudge score as the nudge team keeps it. */
export class DefaultNudgeScore {
  code: string;
  label: string;
  tags: string[];
  checksum: string;
  locale: string;
  visible: boolean;
  updatedAt: number;
  amount: number;
  journeyId: string;
  phone: string;
  graceDays: number;
  status: DefaultNudgeScoreStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    checksum: string,
    locale: string,
    visible: boolean,
    updatedAt: number,
    amount: number,
    journeyId: string,
    phone: string,
    graceDays: number,
    status: DefaultNudgeScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.checksum = checksum;
    this.locale = locale;
    this.visible = visible;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.journeyId = journeyId;
    this.phone = phone;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultNudgeScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultNudgeScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default nudge score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.graceDays - this.amount) * 100) / 100;
  }

  copy(): DefaultNudgeScore {
    return new DefaultNudgeScore(
      this.code,
      this.label,
      this.tags,
      this.checksum,
      this.locale,
      this.visible,
      this.updatedAt,
      this.amount,
      this.journeyId,
      this.phone,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default nudge score in status idle. */
export function newDefaultNudgeScore(code: string, label: string): DefaultNudgeScore {
  return new DefaultNudgeScore(code, label, [], "", "", false, 0, 0, "", "", 0, "idle");
}
